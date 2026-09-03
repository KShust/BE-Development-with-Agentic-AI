// Express app assembly — the eleven-step middleware and route order of plan D-5.
// No `listen()`: the process entry point is src/server.ts (AD-9), so tests mount
// this app with Supertest without binding a port.
//
//  1. helmet
//  2. disable x-powered-by
//  3. trust proxy — explicit hop count, never `true` (SC-5, SR-8)
//  4. CORS — explicit allow-list from env
//  5. requestId — before anything that can terminate a request, so every
//     response (the 429 included) carries X-Request-Id (D-5)
//  6. pino-http request logging, bound to the id from step 5
//  7. auth rate limiter on /api/v1/auth
//  8. express.json with the 10kb body limit (SC-5)
//  9. jsonBodyErrors — translate the parser's 413 / malformed-JSON errors
// 10. module routers under /api/v1
// 11. errorHandler — last (AD-6)

import cors from 'cors';
import express, { type Express, Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { jsonBodyErrors } from './middleware/jsonBodyErrors.js';
import { requestId } from './middleware/requestId.js';
import { createAuthRateLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';

const JSON_BODY_LIMIT = '10kb';

function buildApp(): Express {
  const instance = express();

  instance.use(helmet());
  instance.disable('x-powered-by');
  instance.set('trust proxy', env.TRUST_PROXY);
  instance.use(cors({ origin: env.CORS_ALLOWED_ORIGINS }));

  instance.use(requestId);
  instance.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => String(res.locals.requestId),
    }),
  );

  instance.use('/api/v1/auth', createAuthRateLimiter());

  instance.use(express.json({ limit: JSON_BODY_LIMIT }));
  instance.use(jsonBodyErrors);

  const apiRouter = Router();
  apiRouter.use('/auth', authRouter);
  instance.use('/api/v1', apiRouter);

  instance.use(errorHandler);

  return instance;
}

export const app: Express = buildApp();
