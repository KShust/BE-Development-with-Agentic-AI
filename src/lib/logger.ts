// The single Pino logger instance (security-conventions.md SR-7, SC-9).
//
// Redaction is configured on the logger itself, not left to discipline at each
// call site: the paths below cover SC-9's "never in a log line" list —
// credentials, tokens, cookies, Authorization headers, and connection strings —
// and `remove` drops the key entirely rather than replacing it with a marker.
// General per-request logging is bound to this instance by `pino-http` in
// src/app.ts; the registration audit event (FR-12) is emitted through it too.

import { pino } from 'pino';

import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'password_hash',
      '*.password',
      '*.passwordHash',
      '*.password_hash',
      'token',
      'accessToken',
      'refreshToken',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'DATABASE_URL',
      '*.DATABASE_URL',
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
    ],
    remove: true,
  },
});
