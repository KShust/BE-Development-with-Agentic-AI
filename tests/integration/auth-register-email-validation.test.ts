// Integration coverage: AC-003 (email validation), EC-5 (missing field),
// EC-8 (over-long email). VR-11 (details.fieldErrors is present and never
// empty) is checked on every case here.
//
// Split into its own file for the SC-3 rate-limit reason explained in
// tests/support/api.ts. This file makes 5 requests.

import { beforeEach, describe, expect, it } from 'vitest';

import { truncateAll } from '../support/database.js';
import { registerRequest, validPassword } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

function expectValidationFailed(res: { status: number; body: unknown }, field: string) {
  expect(res.status).toBe(400);
  const body = res.body as {
    error: { code: string; details: { fieldErrors: Record<string, string[]> } };
  };
  expect(body.error.code).toBe('VALIDATION_FAILED');
  expect(body.error.details.fieldErrors[field]?.length).toBeGreaterThan(0);
}

describe('POST /api/v1/auth/register — email validation (AC-003)', () => {
  it('rejects a missing email (VR-1, EC-5)', async () => {
    const res = await registerRequest().send({ password: validPassword() });
    expectValidationFailed(res, 'email');
  });

  it('rejects a non-string email (VR-1)', async () => {
    const res = await registerRequest().send({ email: 12345, password: validPassword() });
    expectValidationFailed(res, 'email');
  });

  it('rejects an invalid email format (VR-2)', async () => {
    const res = await registerRequest().send({ email: 'not-an-email', password: validPassword() });
    expectValidationFailed(res, 'email');
  });

  it('rejects an email over 254 characters, one past the boundary (VR-3, EC-8)', async () => {
    const local = 'a'.repeat(243); // 243 + '@example.com' (12) = 255.
    const email = `${local}@example.com`;
    expect(email.length).toBe(255);

    const res = await registerRequest().send({ email, password: validPassword() });
    expectValidationFailed(res, 'email');
  });

  it('never echoes the submitted password in a validation error (SR-3, SC-9, VR-11)', async () => {
    const password = validPassword();
    const res = await registerRequest().send({ email: 'not-an-email', password });

    expect(JSON.stringify(res.body)).not.toContain(password);
  });
});
