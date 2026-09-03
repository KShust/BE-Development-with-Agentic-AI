// Integration coverage: the request envelope and the 400/413/415 error
// shapes — VR-9 (unknown property), VR-10 (415/413 split),
// IMPACT_ANALYSIS:R-4 and DESIGN_REVIEW:e-2 (the three request shapes that
// converge on one 400 through two different Zod mechanisms — the coverage
// trap the Testing Strategy names explicitly), and the malformed-JSON 400.
//
// Split into its own file for the SC-3 rate-limit reason explained in
// tests/support/api.ts. This file makes 8 requests.

import { beforeEach, describe, expect, it } from 'vitest';

import { truncateAll } from '../support/database.js';
import { errorBody, registerRequest, uniqueEmail, validPassword } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
});

describe('POST /api/v1/auth/register — envelope and 400/413/415 shapes', () => {
  it('rejects an unknown body property with 400, keyed by the offending property name (VR-9, IMPACT_ANALYSIS:R-4)', async () => {
    const res = await registerRequest().send({
      email: uniqueEmail('unknown-prop'),
      password: validPassword(),
      admin: true,
    });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.code).toBe('VALIDATION_FAILED');
    expect(errorBody(res).error.details?.fieldErrors.admin).toBeDefined();
    expect(errorBody(res).error.details?.fieldErrors.admin?.length).toBeGreaterThan(0);
  });

  it('e-2 shape 1 — a JSON array body is 400, naming both email and password as missing (DESIGN_REVIEW:e-2, R-4)', async () => {
    const res = await registerRequest()
      .set('Content-Type', 'application/json')
      .send([] as never);

    expect(res.status).toBe(400);
    expect(errorBody(res).error.code).toBe('VALIDATION_FAILED');
    expect(errorBody(res).error.details?.fieldErrors.email?.length).toBeGreaterThan(0);
    expect(errorBody(res).error.details?.fieldErrors.password?.length).toBeGreaterThan(0);
  });

  it('e-2 shape 2 — a bodyless POST with application/json is 400 VALIDATION_FAILED, not 415 (DESIGN_REVIEW:e-2)', async () => {
    const res = await registerRequest().set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(errorBody(res).error.code).toBe('VALIDATION_FAILED');
    expect(errorBody(res).error.details?.fieldErrors.email?.length).toBeGreaterThan(0);
    expect(errorBody(res).error.details?.fieldErrors.password?.length).toBeGreaterThan(0);
  });

  it('e-2 shape 3 — a bodyless POST with no Content-Type is 400 VALIDATION_FAILED, not 415 (DESIGN_REVIEW:e-2, Error Handling table)', async () => {
    const res = await registerRequest();

    expect(res.status).toBe(400);
    expect(errorBody(res).error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects a request with a body and a non-JSON Content-Type as 415 (VR-10, FR-22)', async () => {
    const res = await registerRequest()
      .set('Content-Type', 'text/plain')
      .send('email=a@example.com&password=aValidPassw0rd!');

    expect(res.status).toBe(415);
    expect(res.body).toEqual({
      error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: expect.any(String) as string },
    });
  });

  it('rejects a request with a body and no Content-Type as 415 (VR-10)', async () => {
    const res = await registerRequest()
      .unset('Content-Type')
      .send(
        Buffer.from(JSON.stringify({ email: uniqueEmail('no-ct'), password: validPassword() })),
      );

    expect(res.status).toBe(415);
    expect(errorBody(res).error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects a body exceeding the 10kb limit with 413 (VR-10, FR-14, SC-5)', async () => {
    const oversized = 'x'.repeat(11 * 1024);
    const res = await registerRequest()
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          email: uniqueEmail('oversized'),
          password: validPassword(),
          padding: oversized,
        }),
      );

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: { code: 'PAYLOAD_TOO_LARGE', message: expect.any(String) as string },
    });
  });

  it('rejects unparseable JSON with 400 MALFORMED_JSON and omits details (Error Handling table, AC-11)', async () => {
    const res = await registerRequest()
      .set('Content-Type', 'application/json')
      .send('{not valid json');

    expect(res.status).toBe(400);
    expect(errorBody(res).error.code).toBe('MALFORMED_JSON');
    expect(errorBody(res).error.details).toBeUndefined();
  });
});
