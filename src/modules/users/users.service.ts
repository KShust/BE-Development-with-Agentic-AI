// Users business logic. Framework-independent (no Express types).
//
// Owns the `User` write path BR-5/BR-6 assign to this module: the uniqueness
// check and the insert are one transaction, opened here (AD-3, PC-9), and the
// check is re-applied inside it to catch the race EC-3 describes. A unique
// violation surfacing from the database (Prisma `P2002`) is translated into the
// same `ConflictError` the pre-check raises, with no Prisma text on it (SR-6,
// SC-9), so the two duplicate paths are indistinguishable to a client.

import { ConflictError } from '../../lib/errors.js';
import { usersRepository, type CustomerRecord, type NewUser } from './users.repository.js';

export type { CustomerRecord } from './users.repository.js';

const DUPLICATE_EMAIL_MESSAGE = 'An account with this email is already registered.';

/**
 * The repository contract this service depends on. The transactional client is
 * opaque here (`unknown`): the service only threads it from `transaction` into
 * the two access-path calls, never inspecting it (AD-3, PC-9).
 */
export interface UsersServiceRepository {
  findByEmail(email: string, client?: unknown): Promise<{ id: string } | null>;
  create(input: NewUser, client?: unknown): Promise<CustomerRecord>;
  transaction(fn: (client: unknown) => Promise<CustomerRecord>): Promise<CustomerRecord>;
}

export interface UsersService {
  emailExists(email: string): Promise<boolean>;
  createCustomer(input: NewUser): Promise<CustomerRecord>;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export function createUsersService(repository: UsersServiceRepository): UsersService {
  return {
    async emailExists(email) {
      return (await repository.findByEmail(email)) !== null;
    },

    createCustomer(input) {
      return repository.transaction(async (tx: unknown) => {
        if ((await repository.findByEmail(input.email, tx)) !== null) {
          throw new ConflictError('EMAIL_ALREADY_REGISTERED', DUPLICATE_EMAIL_MESSAGE);
        }
        try {
          return await repository.create(input, tx);
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new ConflictError('EMAIL_ALREADY_REGISTERED', DUPLICATE_EMAIL_MESSAGE);
          }
          throw error;
        }
      });
    },
  };
}

/** The wired singleton `auth` reaches through (module-map.md cross-module rule). */
export const usersService: UsersService = createUsersService(usersRepository);
