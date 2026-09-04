// Auth routes: path/method wiring and middleware composition only (AD-2).
//
// POST /register is mounted under /api/v1/auth by src/app.ts, so the full path
// is /api/v1/auth/register (FR-1). The boundary validation middleware applies
// the request schema before the controller runs (FR-22).

import { Router } from 'express';

import { validateRequest } from '../../middleware/validateRequest.js';
import { authController } from './auth.controller.js';
import { registerRequestSchema } from './auth.schemas.js';

export const authRouter: Router = Router();

authRouter.post('/register', validateRequest(registerRequestSchema), authController.register);
