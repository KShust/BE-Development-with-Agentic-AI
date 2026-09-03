// Auth business logic. Framework-independent (no Express Request/Response).
//
// Orchestrates registration: it short-circuits the duplicate path without
// hashing (FR-7, SC-3), calls the src/lib hashing helper rather than importing
// `argon2`, calls users.service.ts — the one cross-module edge module-map.md
// permits — and emits the audit event after the account is created,
// best-effort, carrying no email and no IP (FR-12, SC-9, EC-4). A failed audit
// write is logged as an error and does not fail the request.

import type { Logger } from 'pino';

import { hashPassword } from '../../lib/password.js';
import { ConflictError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { usersService, type CustomerRecord, type UsersService } from '../users/users.service.js';

const DUPLICATE_EMAIL_MESSAGE = 'An account with this email is already registered.';

export interface AuthServiceDeps {
  hashPassword(password: string): Promise<string>;
  usersService: UsersService;
  auditLog(event: { event: string; userId: string; requestId: string }): Promise<void>;
  logger: Pick<Logger, 'error'>;
}

export interface AuthService {
  register(
    input: { email: string; password: string },
    context: { requestId: string },
  ): Promise<CustomerRecord>;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  return {
    async register(input, context) {
      if (await deps.usersService.emailExists(input.email)) {
        // FR-7 / SC-3: the duplicate path returns without hashing the password.
        throw new ConflictError('EMAIL_ALREADY_REGISTERED', DUPLICATE_EMAIL_MESSAGE);
      }

      const passwordHash = await deps.hashPassword(input.password);
      const customer = await deps.usersService.createCustomer({ email: input.email, passwordHash });

      // Audit event: after creation, best-effort, no personal data (FR-12, SC-9, EC-4).
      try {
        await deps.auditLog({
          event: 'user.registered',
          userId: customer.id,
          requestId: context.requestId,
        });
      } catch (error) {
        deps.logger.error(
          { err: error, event: 'user.registered.audit_failed' },
          'audit write failed',
        );
      }

      return customer;
    },
  };
}

/** The wired singleton the controller uses (real hashing, real users service, Pino audit line). */
export const authService: AuthService = createAuthService({
  hashPassword,
  usersService,
  auditLog: (event) => {
    logger.info(event);
    return Promise.resolve();
  },
  logger,
});
