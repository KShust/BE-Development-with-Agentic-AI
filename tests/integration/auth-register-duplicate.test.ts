// Integration coverage: AC-002 (duplicate email), BR-009 (the decided
// disclosure), EC-1/EC-2 (case- and whitespace-only duplicates), EC-3
// (concurrent race), SR-6/SC-9 (no Prisma text on the race path).
//
// Split into its own file for the same reason as the other auth-register-*
// files: SC-3's 10/hour/IP register limit and a fresh rate-limiter counter
// per file (tests/support/api.ts). This file makes 8 requests.

import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma.js';
import { truncateAll } from '../support/database.js';
import { registerRequest, uniqueEmail, validPassword } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/v1/auth/register — duplicate email (AC-002)', () => {
  it('rejects a duplicate email with 409 EMAIL_ALREADY_REGISTERED, and creates no second account (FR-6, BR-1)', async () => {
    const email = uniqueEmail('dup');
    const password = validPassword();

    const first = await registerRequest().send({ email, password });
    expect(first.status).toBe(201);

    const second = await registerRequest().send({ email, password });

    expect(second.status).toBe(409);
    expect(second.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: expect.any(String),
      },
    });
    expect((second.body.error.message as string).toLowerCase()).toContain('already registered');

    const rows = await prisma.user.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });

  it('rejects a duplicate that differs only by letter case (EC-1, BR-2)', async () => {
    const base = uniqueEmail('case');
    await registerRequest().send({ email: base, password: validPassword() });

    const res = await registerRequest().send({
      email: base.toUpperCase(),
      password: validPassword(),
    });

    expect(res.status).toBe(409);
    const rows = await prisma.user.findMany({ where: { email: base.toLowerCase() } });
    expect(rows).toHaveLength(1);
  });

  it('rejects a duplicate that differs only by leading or trailing whitespace (EC-2, VR-4)', async () => {
    const base = uniqueEmail('space');
    await registerRequest().send({ email: base, password: validPassword() });

    const res = await registerRequest().send({ email: `  ${base}  `, password: validPassword() });

    expect(res.status).toBe(409);
    const rows = await prisma.user.findMany({ where: { email: base } });
    expect(rows).toHaveLength(1);
  });

  it('returns the identical 409 body for two concurrent registrations of the same email, with no Prisma text leaked (EC-3, SR-6, SC-9)', async () => {
    // Not a timing assertion (Testing Principles forbid those): both requests
    // are dispatched together and this test only inspects which one lost and
    // what its body said, never how long either took. FR-7's "not hashed on
    // the duplicate path" is asserted directly, at the unit level, in
    // src/modules/auth/auth.service.test.ts, where the hash call is
    // observable without depending on relative timing.
    const email = uniqueEmail('race');
    const password = validPassword();

    const [a, b] = await Promise.all([
      registerRequest().send({ email, password }),
      registerRequest().send({ email, password }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);

    const loser = a.status === 409 ? a : b;
    expect(loser.body).toEqual({
      error: { code: 'EMAIL_ALREADY_REGISTERED', message: expect.any(String) },
    });
    const raw = JSON.stringify(loser.body);
    expect(raw).not.toMatch(/P2002/i);
    expect(raw.toLowerCase()).not.toContain('unique constraint');
    expect(raw.toLowerCase()).not.toContain('prisma');

    const rows = await prisma.user.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });
});
