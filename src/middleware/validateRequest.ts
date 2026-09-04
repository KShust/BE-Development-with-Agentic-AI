// Boundary validation middleware (FR-22, AD-5).
//
// Two responsibilities, in order:
//   1. the explicit Content-Type check — a request that carries a body with a
//      missing or non-JSON type is rejected with 415 before the schema runs,
//      because `express.json()` is content-type-conditional and would skip such
//      a request rather than reject it (VR-10, api-conventions.md AC-2);
//   2. Zod application, so the service receives already-validated, typed input.
//      A schema failure is forwarded to the centralized error middleware as the
//      `ZodError` itself — this middleware never builds a response (AC-12).
//
// A bodyless request is left to the schema, which fails it as missing fields:
// that is a 400, not a 415 (Error Handling table).

import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { UnsupportedMediaTypeError } from '../lib/errors.js';

const JSON_CONTENT_TYPE = /^application\/json\b/i;

function requestHasBody(req: Request): boolean {
  const contentLength = req.headers['content-length'];
  if (typeof contentLength === 'string' && Number(contentLength) > 0) {
    return true;
  }
  if (req.headers['transfer-encoding'] !== undefined) {
    return true;
  }
  const body: unknown = req.body;
  return typeof body === 'object' && body !== null && Object.keys(body).length > 0;
}

export function validateRequest(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    if (requestHasBody(req)) {
      const contentType = req.headers['content-type'];
      if (typeof contentType !== 'string' || !JSON_CONTENT_TYPE.test(contentType)) {
        next(
          new UnsupportedMediaTypeError(
            'UNSUPPORTED_MEDIA_TYPE',
            'Request body must be sent with Content-Type: application/json.',
          ),
        );
        return;
      }
    }

    const body: unknown = req.body;
    const result = schema.safeParse(body);
    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
}
