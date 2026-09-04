// Integration coverage: FR-13, EC-7, SC-3 (10 requests per hour per IP),
// D-5 (X-Request-Id survives the limiter), D-6 (no RateLimit-*/Retry-After
// headers).
//
// This is the one auth-register-* file that deliberately exhausts the SC-3
// budget — that is its entire purpose — so it makes 11 requests, one more
// than every other file in this split (tests/support/api.ts explains why the
// split exists). Serial by construction: the limiter counts requests as they
// arrive, so these run one at a time rather than concurrently.

import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma.js';
import { truncateAll } from '../support/database.js';
import { registerRequest, uniqueEmail, validPassword } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/v1/auth/register — rate limit (SC-3: 10/hour/IP)', () => {
  it('returns 429 with the AC-6 body on the 11th request, creating no account and hashing no password (FR-13, EC-7)', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await registerRequest().send({
        email: uniqueEmail(`rl-${i}`),
        password: validPassword(),
      });
      expect(res.status).toBe(201);
    }

    const blockedEmail = uniqueEmail('rl-11th');
    const eleventh = await registerRequest().send({
      email: blockedEmail,
      password: validPassword(),
    });

    expect(eleventh.status).toBe(429);
    expect(eleventh.body).toEqual({
      error: { code: 'RATE_LIMIT_EXCEEDED', message: expect.any(String) as string },
    });

    const row = await prisma.user.findUnique({ where: { email: blockedEmail } });
    expect(row).toBeNull();
  });

  it('carries X-Request-Id on the 429 response, proving the limiter runs after requestId in the middleware order (D-5)', async () => {
    for (let i = 0; i < 10; i += 1) {
      await registerRequest().send({ email: uniqueEmail(`rl2-${i}`), password: validPassword() });
    }

    const res = await registerRequest().send({
      email: uniqueEmail('rl2-11th'),
      password: validPassword(),
    });

    expect(res.status).toBe(429);
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect((res.headers['x-request-id'] as string).length).toBeGreaterThan(0);
  });

  it('does not emit RateLimit-* or Retry-After headers (D-6: standardHeaders/legacyHeaders false)', async () => {
    const res = await registerRequest().send({
      email: uniqueEmail('rl-headers'),
      password: validPassword(),
    });

    expect(res.headers['ratelimit-limit']).toBeUndefined();
    expect(res.headers['ratelimit-remaining']).toBeUndefined();
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    expect(res.headers['retry-after']).toBeUndefined();
  });
});
