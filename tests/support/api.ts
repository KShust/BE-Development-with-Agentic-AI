// Shared Supertest helpers for the `auth-register-*` integration files
// (docs/architecture/module-map.md, Test placement rule).
//
// Deliberately NOT a Vitest globalSetup or fixture: this is plain helper code,
// imported directly by test files. Vitest gives every test FILE its own fresh
// module graph, so importing `app` here still gives each file (and therefore
// each file's register rate-limit budget, security-conventions.md SC-3 — 10
// requests per hour per IP) its own independent Express app instance and its
// own independent in-memory rate-limiter counter. That is *why* the
// auth-register integration coverage is split across several files by topic
// rather than living in one: SC-3's threshold is lower than the number of
// distinct request/response scenarios this Story's contract has, and a single
// file making more than ten requests to this endpoint would start seeing 429s
// that have nothing to do with the case under test. Splitting by topic is an
// ordinary Vitest file boundary, not a change to any approved artifact, and it
// happens to reset the very state SC-3 introduces per docs/evidence/
// US-001-test-generation-report.md.
//
// Never imported by src/ (docs/architecture/module-map.md, Test placement
// rule).

import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import request from 'supertest';

import { app } from '../../src/app.js';

/** A fresh POST /api/v1/auth/register request against this file's app instance. */
export function registerRequest() {
  return request(app).post('/api/v1/auth/register');
}

/** A syntactically valid, collision-free email for one test case. */
export function uniqueEmail(label: string): string {
  return `${label}.${randomUUID()}@example.com`;
}

/**
 * A password satisfying the SC-1 policy: 12-128 Unicode code points, at
 * least 3 of the 4 character classes (here: lower, upper, digit, symbol).
 */
export function validPassword(): string {
  return 'aValidPassw0rd!'; // 15 code points, 4/4 classes.
}

/** The submitted plaintext must never appear anywhere in a response body (SR-3, VR-11, SC-1, SC-9). */
export function expectNoPlaintextLeak(body: unknown, plaintextPassword: string): void {
  expect(JSON.stringify(body)).not.toContain(plaintextPassword);
}

/** No response DTO or error body may carry a credential field, under any key spelling (AC-006, SR-4, FR-11). */
export function expectNoCredentialFields(body: Record<string, unknown>): void {
  expect(body).not.toHaveProperty('password');
  expect(body).not.toHaveProperty('passwordHash');
  expect(body).not.toHaveProperty('password_hash');
}

/** Every declared response on this operation carries X-Request-Id (AC-9, FR-15, NFR-010). */
export function expectRequestIdHeader(res: { headers: Record<string, unknown> }): void {
  expect(res.headers['x-request-id']).toEqual(expect.any(String));
  expect((res.headers['x-request-id'] as string).length).toBeGreaterThan(0);
}

/**
 * The AC-6 error envelope every non-2xx response on this operation carries
 * (docs/architecture/api-conventions.md AC-6). Supertest types `res.body` as
 * `any`; naming the shape here keeps that `any` from spreading through every
 * assertion, and matches the pattern the validation files already use.
 */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: { fieldErrors: Record<string, string[] | undefined> };
  };
}

/** The four-field Customer DTO the 201 carries (US-001 api-design, Responses). */
export interface CustomerDto {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export function errorBody(res: { body: unknown }): ErrorBody {
  return res.body as ErrorBody;
}

export function customerBody(res: { body: unknown }): CustomerDto {
  return res.body as CustomerDto;
}
