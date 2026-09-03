// Auth controller: translates the already-validated request into a service call
// and shapes the success response (FR-5, FR-11, AC-12). No business logic, and
// no try/catch to build an error body — Express 5 forwards a rejected promise
// from this async handler to the centralized error middleware on its own.

import type { RequestHandler } from 'express';

import { authService, type AuthService } from './auth.service.js';
import type { RegisterRequest, RegisterResponse } from './auth.schemas.js';

export function createAuthController(service: AuthService): { register: RequestHandler } {
  return {
    register: async (req, res) => {
      const { email, password } = req.body as RegisterRequest;
      const requestId = String(res.locals.requestId);

      const customer = await service.register({ email, password }, { requestId });

      const body: RegisterResponse = {
        id: customer.id,
        email: customer.email,
        role: customer.role,
        createdAt: customer.createdAt.toISOString(),
      };
      res.status(201).json(body);
    },
  };
}

export const authController = createAuthController(authService);
