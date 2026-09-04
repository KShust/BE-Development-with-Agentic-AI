// Unit coverage for the Argon2id wrapper FR-24 assigns to this file: applies
// the SC-1 cost parameters explicitly on every call, so no call site can omit
// one (SR-1, SR-2). No Express, no database (Test Levels: Unit).
//
// Assumed export: `hashPassword(password: string): Promise<string>`. US-001
// issues no token and performs no sign-in, so it needs to hash only — a
// `verifyPassword` counterpart belongs to whichever Story first needs it
// (module-map.md: "token/hash helpers ... created by the Story that first
// needs them"), and is out of scope here.

import argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';

vi.mock('argon2', () => ({
  default: {
    argon2id: 2,
    hash: vi.fn().mockResolvedValue('$argon2id$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA'),
  },
}));

import { hashPassword } from './password.js';

describe('hashPassword (SC-1, SR-1, SR-2)', () => {
  it('hashes with Argon2id and exactly the three decided cost parameters, on every call', async () => {
    await hashPassword('a plaintext password');

    expect(argon2.hash).toHaveBeenCalledWith('a plaintext password', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  });

  it('does not rely on the library defaults — every parameter is passed explicitly', async () => {
    await hashPassword('another password');

    const [, options] = vi.mocked(argon2.hash).mock.calls.at(-1) ?? [];
    expect(options).toEqual({
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  });

  it('returns the encoded hash argon2 produces', async () => {
    const hash = await hashPassword('a plaintext password');
    expect(hash).toBe('$argon2id$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA');
  });

  it('never returns the plaintext password itself (SR-3)', async () => {
    const hash = await hashPassword('a plaintext password');
    expect(hash).not.toContain('a plaintext password');
  });
});
