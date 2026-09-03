// Unit coverage for the boundary validation middleware's 415-vs-400 split
// (FR-22, VR-10): a body-bearing request with a missing or non-JSON
// Content-Type is rejected before the schema ever runs; a bodyless request is
// left to the schema, which fails it as missing fields (Error Handling
// table). No Express app, no database (Test Levels: Unit) — the full
// Content-Type/body-presence matrix, including how `express.json()` itself
// behaves upstream, is proven at the integration level in
// tests/integration/auth-register-envelope.test.ts.
//
// Assumed export: `validateRequest(schema)`, a factory returning Express
// middleware — the shape FR-22 requires (shared, applied per route) and the
// one this module needs to be parametrized by the Zod schema each route
// supplies.

import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import { UnsupportedMediaTypeError } from '../lib/errors.js';
import { validateRequest } from './validateRequest.js';

const schema = z.strictObject({ email: z.string(), password: z.string() });

function fakeReq(overrides: Partial<Request>): Request {
  return { headers: {}, body: undefined, ...overrides } as Request;
}

describe('validateRequest — 415-vs-400 split (FR-22, VR-10)', () => {
  it('rejects a request with a body and a non-JSON Content-Type as 415, before the schema runs', () => {
    const req = fakeReq({ headers: { 'content-type': 'text/plain', 'content-length': '20' } });
    const next = vi.fn();

    validateRequest(schema)(req, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(UnsupportedMediaTypeError));
  });

  it('rejects a request with a body and no Content-Type at all as 415', () => {
    const req = fakeReq({ headers: { 'content-length': '20' } });
    const next = vi.fn();

    validateRequest(schema)(req, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.any(UnsupportedMediaTypeError));
  });

  it('does not raise 415 for a bodyless request, leaving it to the schema instead (Error Handling table)', () => {
    const req = fakeReq({ headers: {} });
    const next = vi.fn();

    validateRequest(schema)(req, {} as Response, next as NextFunction);

    const firstCallArg: unknown = next.mock.calls[0]?.[0];
    expect(firstCallArg).not.toBeInstanceOf(UnsupportedMediaTypeError);
  });

  it('applies the schema and calls next() with no error on a valid application/json body', () => {
    const req = fakeReq({
      headers: { 'content-type': 'application/json' },
      body: { email: 'a@example.com', password: 'aValidPassw0rd!' },
    });
    const next = vi.fn();

    validateRequest(schema)(req, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a schema failure to next() as a ZodError rather than building a response itself (AC-12)', () => {
    const req = fakeReq({
      headers: { 'content-type': 'application/json' },
      body: { email: 'a@example.com' },
    });
    const next = vi.fn();

    validateRequest(schema)(req, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'ZodError' }));
  });
});
