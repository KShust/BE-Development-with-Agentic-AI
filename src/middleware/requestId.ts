// Per-request id for response/log correlation (api-conventions.md AC-9, FR-15,
// NFR-010).
//
// Reuses a trusted inbound `X-Request-Id` when one is present and safe to echo,
// otherwise mints a UUID. The value is placed on `res.locals.requestId` (read by
// the controller for the audit event) and on the response header. `pino-http` is
// configured in src/app.ts to take its `req.id` from the same value, so one id
// ties the response header to every log line for the request.

import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

const INBOUND_HEADER = 'x-request-id';
const OUTBOUND_HEADER = 'X-Request-Id';

// A trusted inbound id must be bounded and free of control or header-splitting
// characters before it is echoed into a response header or a log line (SC-9).
const SAFE_ID = /^[A-Za-z0-9._~-]{1,128}$/;

export const requestId: RequestHandler = (req, res, next) => {
  const inbound = req.headers[INBOUND_HEADER];
  const candidate = Array.isArray(inbound) ? inbound[0] : inbound;
  const id = typeof candidate === 'string' && SAFE_ID.test(candidate) ? candidate : randomUUID();

  res.locals.requestId = id;
  res.setHeader(OUTBOUND_HEADER, id);
  next();
};
