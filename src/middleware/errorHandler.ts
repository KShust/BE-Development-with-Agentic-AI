// Centralized Express error-handling middleware (architecture.md AD-6,
// api-conventions.md AC-12): the single place that maps an error to an HTTP
// response. Registered last in src/app.ts.
//
// It maps exactly two things and nothing else:
//   - a `ZodError` surfaced by the boundary validation middleware -> 400
//     `VALIDATION_FAILED`, with a populated `details.fieldErrors` that is never
//     empty (VR-11, contract `minProperties: 1`). This file is the sole owner of
//     that shape, including the two IMPACT_ANALYSIS:R-4 mappings Zod leaves empty
//     by default;
//   - a `DomainError` subclass -> the status its semantic carries (AD-6), with
//     `error.code` taken from the error and no `details`.
// Anything else is an unmapped failure -> a generic 500 that leaks nothing on
// SC-9's list.

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import {
  ConflictError,
  DomainError,
  PayloadTooLargeError,
  TooManyRequestsError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../lib/errors.js';

function statusForDomainError(err: DomainError): number {
  if (err instanceof ConflictError) return 409;
  if (err instanceof UnsupportedMediaTypeError) return 415;
  if (err instanceof PayloadTooLargeError) return 413;
  if (err instanceof TooManyRequestsError) return 429;
  if (err instanceof ValidationError) return 400;
  return 500;
}

function toFieldErrors(err: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  const add = (key: string, message: string): void => {
    (fieldErrors[key] ??= []).push(message);
  };

  for (const issue of err.issues) {
    if (issue.code === 'unrecognized_keys' && 'keys' in issue) {
      for (const key of issue.keys) {
        add(key, 'Unrecognized property is not allowed.');
      }
      continue;
    }

    const field = issue.path[0];
    if (field === undefined) {
      // A root-level failure — e.g. a body that is not an object at all —
      // supplies neither required field (DESIGN_REVIEW:e-2, IMPACT_ANALYSIS:R-4).
      // Zod reports it under the object root, which the default flattening drops.
      add('email', 'A JSON object with "email" and "password" is required.');
      add('password', 'A JSON object with "email" and "password" is required.');
      continue;
    }

    add(String(field), issue.message);
  }

  if (Object.keys(fieldErrors).length === 0) {
    // VR-11 / contract minProperties: 1 — a VALIDATION_FAILED response never
    // names zero fields.
    add('email', 'Invalid request.');
    add('password', 'Invalid request.');
  }

  return fieldErrors;
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  void req;

  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'The request did not pass validation.',
        details: { fieldErrors: toFieldErrors(err) },
      },
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(statusForDomainError(err)).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}
