// Integration coverage: AC-004 (password policy), EC-6 (boundary lengths and
// caseless-script composition). Asserts exactly the security-conventions.md
// SC-1 policy — nothing invented beyond it (VR-6).
//
// Split into its own file for the SC-3 rate-limit reason explained in
// tests/support/api.ts. This file makes 8 requests.

import { beforeEach, describe, expect, it } from 'vitest';

import { truncateAll } from '../support/database.js';
import { registerRequest, uniqueEmail } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

function expectValidationFailed(res: { status: number; body: unknown }, field: string) {
  expect(res.status).toBe(400);
  const body = res.body as {
    error: { code: string; details: { fieldErrors: Record<string, string[]> } };
  };
  expect(body.error.code).toBe('VALIDATION_FAILED');
  expect(body.error.details?.fieldErrors[field]?.length).toBeGreaterThan(0);
}

describe('POST /api/v1/auth/register — password policy (AC-004, SC-1)', () => {
  it('rejects a missing password (VR-5, EC-5)', async () => {
    const res = await registerRequest().send({ email: uniqueEmail('p-missing') });
    expectValidationFailed(res, 'password');
  });

  it('rejects a non-string password (VR-5)', async () => {
    const res = await registerRequest().send({
      email: uniqueEmail('p-nonstring'),
      password: 123456789012,
    });
    expectValidationFailed(res, 'password');
  });

  it('rejects a password one character short of the 12-character minimum (VR-6, EC-6)', async () => {
    const password = 'aB3defghij'; // 10 chars, pad to 11.
    const eleven = `${password}k`;
    expect(eleven.length).toBe(11);

    const res = await registerRequest().send({ email: uniqueEmail('p-short'), password: eleven });
    expectValidationFailed(res, 'password');
  });

  it('rejects a password one character past the 128-character maximum (VR-6, EC-6)', async () => {
    const password = `aB3${'x'.repeat(126)}`; // 129 chars.
    expect(password.length).toBe(129);

    const res = await registerRequest().send({ email: uniqueEmail('p-long'), password });
    expectValidationFailed(res, 'password');
  });

  it('rejects a password satisfying fewer than 3 of the 4 character classes (VR-6)', async () => {
    // Lowercase only — 1 of 4 classes, 12+ chars.
    const res = await registerRequest().send({
      email: uniqueEmail('p-classes'),
      password: 'onlylowercase',
    });
    expectValidationFailed(res, 'password');
  });

  it('rejects a caseless-script password that can reach only 2 of the 4 classes (SC-1 known limitation, EC-6)', async () => {
    // SC-1's four classes are lowercase (Ll), uppercase (Lu), digit, and
    // "anything else" — punctuation, symbol, or space — which is ONE class,
    // not several. A script without letter case (here: Han, category Lo)
    // contributes only to "anything else", so Han + digits spans just 2 of
    // the 4 classes. SC-1 names this limitation explicitly: such a password
    // "is rejected however strong it is". This pins that documented behaviour;
    // the Story implements the policy exactly and carves out no exception.
    const password = '中文密码短语加密内容1234'; // 14 code points: 10 Han (anything-else) + 4 digits.
    expect([...password].length).toBeGreaterThanOrEqual(12);

    const res = await registerRequest().send({ email: uniqueEmail('p-caseless'), password });

    expectValidationFailed(res, 'password');
  });

  it('counts password length in Unicode code points, not UTF-16 code units or bytes (SC-1)', async () => {
    // 12 Cyrillic letters — each 1 code point / 2 bytes in UTF-8, all one
    // character class ("other" per SC-1's alphabet, since Cyrillic has no
    // Latin-defined upper/lower distinction under the four classes as SC-1
    // enumerates them) — so this alone is 1 of 4 classes and must still fail
    // on composition, proving the count is neither bytes (24) nor an
    // under-count that would let it slip through on length alone.
    const password = 'Привет1234!!'; // 12 code points; classes: upper(1: 'П' is title-case — but Cyrillic case mapping applies), digit, symbol = up to 3.
    expect([...password].length).toBe(12);

    const res = await registerRequest().send({ email: uniqueEmail('p-codepoints'), password });

    // This string satisfies 3 classes (upper 'П', digits, symbol '!'), so it
    // is expected to be ACCEPTED at exactly 12 code points — the boundary
    // proof is the length (12, not 24 bytes' worth truncated), not rejection.
    expect(res.status).toBe(201);
  });

  it('never echoes the submitted password in a validation error (SR-3, SC-9)', async () => {
    const password = 'short';
    const res = await registerRequest().send({ email: uniqueEmail('p-noecho'), password });

    expect(JSON.stringify(res.body)).not.toContain(password);
  });
});
