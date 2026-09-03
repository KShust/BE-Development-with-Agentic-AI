// Argon2id password hashing (FR-24). Wraps `argon2`, passing all three SC-1 cost
// parameters explicitly on every call — never relying on the library defaults,
// which move between releases (SC-1). `auth.service.ts` calls this helper and
// never imports `argon2` itself.
//
// US-001 issues no token and performs no sign-in, so this Story needs to hash
// only; a `verifyPassword` counterpart belongs to the Story that first needs it
// (module-map.md: "token/hash helpers ... created by the Story that first needs
// them"), which is US-002.

import argon2 from 'argon2';

import { ARGON2ID_PARAMETERS } from '../config/env.js';

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ARGON2ID_PARAMETERS.memoryCost,
    timeCost: ARGON2ID_PARAMETERS.timeCost,
    parallelism: ARGON2ID_PARAMETERS.parallelism,
  });
}
