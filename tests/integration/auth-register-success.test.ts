// Integration coverage: the happy path (AC-001), password storage (AC-005),
// the secure response (AC-006), normalization on the stored value (BR-2,
// VR-4), and contract conformance for the 201 (AC-10).
//
// Mounts src/app.ts with Supertest (AD-9) — no port bound, no mock of any
// layer below HTTP. Runs against the PC-1 disposable database; see
// tests/support/globalSetup.ts and tests/support/database.ts.
//
// Kept to a handful of requests deliberately: see tests/support/api.ts for
// why (security-conventions.md SC-3, the register rate limit).

import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma.js';
import { truncateAll } from '../support/database.js';
import {
  expectNoCredentialFields,
  expectNoPlaintextLeak,
  expectRequestIdHeader,
  registerRequest,
  uniqueEmail,
  validPassword,
} from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/v1/auth/register — success (AC-001)', () => {
  it('creates an account and returns 201 with exactly the four contract fields', async () => {
    const email = uniqueEmail('success');
    const password = validPassword();

    const res = await registerRequest().send({ email, password });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['createdAt', 'email', 'id', 'role']);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('CUSTOMER');
    expect(typeof res.body.id).toBe('string');
    expect(res.body.id.length).toBeGreaterThan(0);
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
  });

  it('sets role to CUSTOMER (FR-3, SC-2)', async () => {
    const res = await registerRequest().send({
      email: uniqueEmail('role'),
      password: validPassword(),
    });

    expect(res.body.role).toBe('CUSTOMER');
  });

  it('returns X-Request-Id on the success response (AC-9, FR-15, NFR-010)', async () => {
    const res = await registerRequest().send({
      email: uniqueEmail('reqid'),
      password: validPassword(),
    });

    expectRequestIdHeader(res);
  });

  it('persists exactly one row, retrievable by the normalized email (FR-2, BR-1)', async () => {
    const email = uniqueEmail('persist');

    await registerRequest().send({ email, password: validPassword() });

    const row = await prisma.user.findUnique({ where: { email } });
    expect(row).not.toBeNull();
    expect(row?.email).toBe(email);
  });

  it('stores the password only as an Argon2id hash, never in plaintext (AC-005, SR-1)', async () => {
    const email = uniqueEmail('hash');
    const password = validPassword();

    await registerRequest().send({ email, password });

    const row = await prisma.user.findUnique({ where: { email } });
    expect(row?.passwordHash).not.toBe(password);
    expect(row?.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('normalizes the email — trims and lowercases before storing and returning it (BR-2, VR-4, EC-1, EC-2)', async () => {
    const base = uniqueEmail('normalize');
    const submitted = `  ${base.toUpperCase()}  `;

    const res = await registerRequest().send({ email: submitted, password: validPassword() });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(base.toLowerCase());
    const row = await prisma.user.findUnique({ where: { email: base.toLowerCase() } });
    expect(row).not.toBeNull();
  });

  it('never returns the password or password hash in the response body (AC-006, SR-4)', async () => {
    const password = validPassword();
    const res = await registerRequest().send({ email: uniqueEmail('secure'), password });

    expectNoCredentialFields(res.body as Record<string, unknown>);
    expectNoPlaintextLeak(res.body, password);
  });

  it('accepts an email at exactly the 254-character bound (VR-3)', async () => {
    // 254 total: a 242-char local part + "@example.com" (12 chars).
    const local = 'a'.repeat(242);
    const email = `${local}@example.com`;
    expect(email.length).toBe(254);

    const res = await registerRequest().send({ email, password: validPassword() });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
  });

  it('accepts a password at exactly the 12-character minimum (VR-6)', async () => {
    const password = 'aB3defghijk9'; // 12 code points, 3 classes.
    expect(password.length).toBe(12);

    const res = await registerRequest().send({ email: uniqueEmail('pwd-min'), password });

    expect(res.status).toBe(201);
  });

  it('accepts a password at exactly the 128-character maximum (VR-6)', async () => {
    const password = `aB3${'x'.repeat(125)}`; // 128 chars, 3 classes (lower/upper/digit).
    expect(password.length).toBe(128);

    const res = await registerRequest().send({ email: uniqueEmail('pwd-max'), password });

    expect(res.status).toBe(201);
  });
});
