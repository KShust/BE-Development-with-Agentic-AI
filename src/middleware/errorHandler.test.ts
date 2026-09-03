// Unit coverage for the centralized error middleware (AD-6): the ZodError →
// fieldErrors mapping, including both IMPACT_ANALYSIS:R-4 cases, and the
// DomainError-subclass → status/code mapping. No Express app, no database
// (Test Levels: Unit).
//
// Assumed export: `errorHandler(err, req, res, next)`, the standard Express
// 4-arity error-middleware signature (AD-6, AC-12). `req` is stubbed to the
// minimum this middleware needs; request-id log correlation (AC-9) is
// asserted at the integration level instead, where a real request actually
// carries one.

import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { describe, expect, it, vi } from 'vitest';

import {
  ConflictError,
  PayloadTooLargeError,
  TooManyRequestsError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../lib/errors.js';
import { errorHandler } from './errorHandler.js';

function fakeResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function jsonBody(res: Response) {
  return vi.mocked(res.json).mock.calls[0]?.[0] as {
    error: { code: string; message: string; details?: { fieldErrors: Record<string, string[]> } };
  };
}

const registrationSchema = z.strictObject({ email: z.string(), password: z.string() });

describe('errorHandler — ZodError mapping (VR-11, AC-6)', () => {
  it('keys an unrecognized-property failure by the offending property name, not left empty (IMPACT_ANALYSIS:R-4)', () => {
    const result = registrationSchema.safeParse({
      email: 'a@example.com',
      password: 'aValidPassw0rd!',
      admin: true,
    });
    expect(result.success).toBe(false);

    const res = fakeResponse();
    errorHandler(result.error as ZodError, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = jsonBody(res);
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details?.fieldErrors.admin?.length).toBeGreaterThan(0);
  });

  it('keys a root-level (non-object body) failure onto both required fields, not left empty (IMPACT_ANALYSIS:R-4, DESIGN_REVIEW:e-2)', () => {
    const result = registrationSchema.safeParse([]);
    expect(result.success).toBe(false);

    const res = fakeResponse();
    errorHandler(result.error as ZodError, {} as Request, res, vi.fn() as NextFunction);

    const body = jsonBody(res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details?.fieldErrors.email?.length).toBeGreaterThan(0);
    expect(body.error.details?.fieldErrors.password?.length).toBeGreaterThan(0);
  });

  it('never sends an empty fieldErrors object for any ZodError (VR-11, contract minProperties: 1)', () => {
    const result = registrationSchema.safeParse({ email: 123, password: null });
    const res = fakeResponse();

    errorHandler(result.error as ZodError, {} as Request, res, vi.fn() as NextFunction);

    const body = jsonBody(res);
    expect(Object.keys(body.error.details?.fieldErrors ?? {}).length).toBeGreaterThan(0);
  });

  it('never echoes a submitted password value in message or details (SR-3, SC-9)', () => {
    const secret = 'aV3rySecretPassphrase!!';
    const result = registrationSchema.safeParse({ email: 'a@example.com', password: 123 });
    const res = fakeResponse();

    errorHandler(result.error as ZodError, {} as Request, res, vi.fn() as NextFunction);

    expect(JSON.stringify(jsonBody(res))).not.toContain(secret);
  });
});

describe('errorHandler — DomainError mapping (AD-6)', () => {
  it.each([
    [new ConflictError('EMAIL_ALREADY_REGISTERED'), 409, 'EMAIL_ALREADY_REGISTERED'],
    [new UnsupportedMediaTypeError('UNSUPPORTED_MEDIA_TYPE'), 415, 'UNSUPPORTED_MEDIA_TYPE'],
    [new PayloadTooLargeError('PAYLOAD_TOO_LARGE'), 413, 'PAYLOAD_TOO_LARGE'],
    [new TooManyRequestsError('RATE_LIMIT_EXCEEDED'), 429, 'RATE_LIMIT_EXCEEDED'],
    [new ValidationError('MALFORMED_JSON'), 400, 'MALFORMED_JSON'],
  ] as const)('maps a domain error carrying %o to status %i with code %s', (err, status, code) => {
    const res = fakeResponse();
    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(jsonBody(res).error.code).toBe(code);
  });

  it('omits details entirely for MALFORMED_JSON rather than sending it empty (AC-11, Error Handling table)', () => {
    const res = fakeResponse();
    errorHandler(
      new ValidationError('MALFORMED_JSON'),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(jsonBody(res).error.details).toBeUndefined();
  });

  it('returns a generic 500 body for an unmapped error, leaking no internals (SC-9, SR-6)', () => {
    const res = fakeResponse();
    errorHandler(
      new Error('postgres://user:pass@host:5432/db is unreachable'),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    const body = jsonBody(res);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toContain('postgres://');
  });
});
