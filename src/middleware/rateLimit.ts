// The `express-rate-limit` factory for the authentication endpoints (FR-13,
// FR-23, security-conventions.md SC-3), mounted on `/api/v1/auth` in src/app.ts.
//
// SC-3 decides the register threshold — 10 requests per hour per IP — and leaves
// login / refresh / logout to the Stories that add those endpoints; this Story
// sets none of them. `standardHeaders` and `legacyHeaders` are both false so the
// limiter emits no `RateLimit-*` or `Retry-After` header: the approved contract
// declares none (plan D-6). The custom handler raises a `TooManyRequestsError`
// rather than writing its own body, so the 429 is built in the centralized error
// middleware like every other error response (AD-6).

import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';

import { TooManyRequestsError } from '../lib/errors.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const REGISTER_LIMIT_PER_HOUR = 10;

export function createAuthRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: ONE_HOUR_MS,
    limit: REGISTER_LIMIT_PER_HOUR,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests. Please try again later.',
        ),
      );
    },
  });
}
