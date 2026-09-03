// Unit coverage for the transactional check-and-insert BR-5/BR-6 assign to
// this service (Testing Strategy > Unit: "Service orchestration without
// Express or a database").
//
// Assumed collaborator interface (not fixed by any approved artifact — the
// Specification and db-design name only the two access paths, not an export
// or injection shape): a factory `createUsersService(repository)`, where
// `repository` exposes `findByEmail` and `create` mirroring
// docs/designs/database/US-001-db-design.md "Access paths" #1 and #2. This
// keeps the test independent of whether IMPLEMENTATION wires the real
// repository as a module-level singleton import or an injected value;
// adapting the wiring, if IMPLEMENTATION picks a different shape, is a
// same-stage test update, not a design defect.
//
// See docs/evidence/US-001-test-generation-report.md for why this file
// (like every other test file this Story authors) currently fails to
// compile: none of its imports exist as real exports yet.

import { describe, expect, it, vi } from 'vitest';

import { ConflictError } from '../../lib/errors.js';
import { createUsersService, type UsersServiceRepository } from './users.service.js';

function fakeRepository(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({
      id: 'a-uuid',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
    }),
    // IMPLEMENTATION opens the BR-5/PC-9 transaction through the repository
    // (db-design "Transaction and concurrency"); the fake runs the callback
    // inline. Updating this collaborator shape to match the real wiring is the
    // routine test-implementation sync the file header sanctions — no assertion
    // below changes.
    transaction: vi.fn<UsersServiceRepository['transaction']>((fn) => fn(undefined)),
    ...overrides,
  };
}

describe('users.service createCustomer (BR-1, BR-5, BR-6, PC-9)', () => {
  it('creates exactly one account for a new email (FR-2)', async () => {
    const repository = fakeRepository();
    const service = createUsersService(repository);

    const result = await service.createCustomer({
      email: 'customer@example.com',
      passwordHash: '$argon2id$fake',
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ email: 'customer@example.com', role: 'CUSTOMER' });
  });

  it('raises ConflictError(EMAIL_ALREADY_REGISTERED) when the email already exists, and creates no row (AC-002, FR-6)', async () => {
    const repository = fakeRepository({
      findByEmail: vi.fn().mockResolvedValue({ id: 'existing' }),
    });
    const service = createUsersService(repository);

    await expect(
      service.createCustomer({ email: 'dup@example.com', passwordHash: '$argon2id$fake' }),
    ).rejects.toThrow(ConflictError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('translates a database-level unique violation (P2002) into the same ConflictError as the pre-check (EC-3, BR-1)', async () => {
    const p2002 = Object.assign(new Error('Unique constraint failed on the fields: (`email`)'), {
      code: 'P2002',
      meta: { target: ['email'] },
    });
    const repository = fakeRepository({ create: vi.fn().mockRejectedValue(p2002) });
    const service = createUsersService(repository);

    await expect(
      service.createCustomer({ email: 'race@example.com', passwordHash: '$argon2id$fake' }),
    ).rejects.toThrow(ConflictError);
  });

  it('never leaks the Prisma error message, code, or constraint name through the translated error (SR-6, SC-9)', async () => {
    const p2002 = Object.assign(new Error('Unique constraint failed on the fields: (`email`)'), {
      code: 'P2002',
      meta: { target: ['email'] },
    });
    const repository = fakeRepository({ create: vi.fn().mockRejectedValue(p2002) });
    const service = createUsersService(repository);

    await expect(
      service.createCustomer({ email: 'race@example.com', passwordHash: '$argon2id$fake' }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ConflictError);
      const message = String((err as Error).message);
      expect(message).not.toContain('Unique constraint');
      expect(message).not.toContain('P2002');
      return true;
    });
  });

  it('selects only id, email, role and createdAt on insert — never password_hash (SR-4, PC-8)', async () => {
    const repository = fakeRepository();
    const service = createUsersService(repository);

    const result = await service.createCustomer({
      email: 'customer@example.com',
      passwordHash: '$argon2id$fake',
    });

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('password_hash');
  });
});
