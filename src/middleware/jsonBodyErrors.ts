// Translates the JSON body parser's own errors into domain errors (plan D-7),
// mounted immediately after `express.json()` in src/app.ts.
//
// Neither failure is a `ZodError` or a `DomainError` as `express.json()` raises
// it, so without this step the centralized error middleware would return a
// generic 500 for a case the contract declares (413 / 400 MALFORMED_JSON, AD-6).
// It is a small dedicated middleware rather than part of the boundary validation
// or the error handler: the two run at different mount points, and teaching the
// error handler to recognise a library's error objects would give it a third
// category the architecture keeps out of it (API design, "Who translates the
// body-parser's errors").

import type { ErrorRequestHandler } from 'express';

import { PayloadTooLargeError, ValidationError } from '../lib/errors.js';

function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const { type } = err as { type?: unknown };
    return typeof type === 'string' ? type : undefined;
  }
  return undefined;
}

export const jsonBodyErrors: ErrorRequestHandler = (err, _req, _res, next) => {
  switch (bodyParserErrorType(err)) {
    case 'entity.too.large':
      next(
        new PayloadTooLargeError(
          'PAYLOAD_TOO_LARGE',
          'Request body exceeds the maximum allowed size.',
        ),
      );
      return;
    case 'entity.parse.failed':
      next(new ValidationError('MALFORMED_JSON', 'Request body is not valid JSON.'));
      return;
    default:
      next(err);
  }
};
