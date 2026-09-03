// Unit coverage for auth.service.ts's orchestration (Testing Strategy > Unit:
// "Service orchestration without Express or a database").
//
// Assumed collaborator interface, for the same reason and with the same
// caveat as src/modules/users/users.service.test.ts: a factory
// `createAuthService(deps)` with injected `hashPassword`, `usersService`
// (exposing `emailExists` and `createCustomer`), `auditLog` and `logger`.
//
// The `emailExists` pre-check is this test's own resolution of a real tension
// between two approved requirements that no single artifact spells out
// end-to-end: FR-7 requires the duplicate path to skip hashing entirely, while
// BR-5/BR-6 require the uniqueness check and the insert to be one transaction
// owned by users.service.ts. A cheap, non-transactional pre-check in
// auth.service.ts (skipping the hash and the transactional call when it finds
// a match) plus the transactional check-and-insert already required by BR-5
// (which still has to re-check, to catch the race EC-3 describes) satisfies
// both without contradiction. IMPLEMENTATION is free to reach the same
// externally-observable behavior a different way; if it does, this file's
// fakes need updating to match, which is a routine test-implementation sync,
// not a spec deviation.
//
// See docs/evidence/US-001-test-generation-report.md for why this file
// currently fails to compile: none of its imports exist as real exports yet.

import { describe, expect, it, vi } from 'vitest';

import { ConflictError } from '../../lib/errors.js';
import { createAuthService } from './auth.service.js';

function fakeDeps(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    hashPassword: vi.fn().mockResolvedValue('$argon2id$fake'),
    usersService: {
      emailExists: vi.fn().mockResolvedValue(false),
      createCustomer: vi.fn().mockResolvedValue({
        id: 'a-uuid',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        createdAt: new Date('2026-09-03T00:00:00.000Z'),
      }),
    },
    auditLog: vi.fn().mockResolvedValue(undefined),
    logger: { error: vi.fn() },
    ...overrides,
  };
}

describe('auth.service register — orchestration', () => {
  it('hashes the password and creates the account on the happy path (AC-001, FR-10)', async () => {
    const deps = fakeDeps();
    const service = createAuthService(deps as never);

    const result = await service.register(
      { email: 'customer@example.com', password: 'aValidPassw0rd!' },
      { requestId: 'req-1' },
    );

    expect(deps.hashPassword).toHaveBeenCalledWith('aValidPassw0rd!');
    expect(deps.usersService.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'customer@example.com', passwordHash: '$argon2id$fake' }),
    );
    expect(result).toMatchObject({ email: 'customer@example.com', role: 'CUSTOMER' });
  });

  it('never hashes the password on the duplicate-email path (FR-7, SC-3)', async () => {
    const deps = fakeDeps({
      usersService: {
        emailExists: vi.fn().mockResolvedValue(true),
        createCustomer: vi.fn(),
      },
    });
    const service = createAuthService(deps as never);

    await expect(
      service.register(
        { email: 'dup@example.com', password: 'aValidPassw0rd!' },
        { requestId: 'req-2' },
      ),
    ).rejects.toThrow(ConflictError);

    expect(deps.hashPassword).not.toHaveBeenCalled();
    expect(deps.usersService.createCustomer).not.toHaveBeenCalled();
  });

  it('still hashes the password when the pre-check passes but the insert loses the race, and surfaces the same ConflictError (EC-3, BR-1)', async () => {
    const deps = fakeDeps({
      usersService: {
        emailExists: vi.fn().mockResolvedValue(false),
        createCustomer: vi.fn().mockRejectedValue(new ConflictError('EMAIL_ALREADY_REGISTERED')),
      },
    });
    const service = createAuthService(deps as never);

    await expect(
      service.register(
        { email: 'race@example.com', password: 'aValidPassw0rd!' },
        { requestId: 'req-6' },
      ),
    ).rejects.toThrow(ConflictError);
    expect(deps.hashPassword).toHaveBeenCalled();
  });

  it('emits a user.registered audit event carrying only event, userId and requestId, after account creation (AC-007, FR-12)', async () => {
    const deps = fakeDeps();
    const service = createAuthService(deps as never);

    await service.register(
      { email: 'customer@example.com', password: 'aValidPassw0rd!' },
      { requestId: 'req-3' },
    );

    expect(deps.auditLog).toHaveBeenCalledWith({
      event: 'user.registered',
      userId: 'a-uuid',
      requestId: 'req-3',
    });
  });

  it('does not include the email or any personal data in the audit event (SC-9)', async () => {
    const deps = fakeDeps();
    const service = createAuthService(deps as never);

    await service.register(
      { email: 'customer@example.com', password: 'aValidPassw0rd!' },
      { requestId: 'req-4' },
    );

    const [payload] = vi.mocked(deps.auditLog).mock.calls[0] ?? [];
    expect(JSON.stringify(payload)).not.toContain('customer@example.com');
  });

  it('logs a failed audit write as an error and still returns the created account (EC-4)', async () => {
    const deps = fakeDeps({ auditLog: vi.fn().mockRejectedValue(new Error('sink unavailable')) });
    const service = createAuthService(deps as never);

    const result = await service.register(
      { email: 'customer@example.com', password: 'aValidPassw0rd!' },
      { requestId: 'req-5' },
    );

    expect(result).toMatchObject({ email: 'customer@example.com' });
    expect(deps.logger.error).toHaveBeenCalled();
  });
});
