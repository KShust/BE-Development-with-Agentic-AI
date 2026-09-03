// Truncation fixture for the `integration` Vitest project
// (docs/architecture/persistence-conventions.md PC-1).
//
// One table only: `user` is the whole of a Customer's persisted state for
// this Story (docs/designs/database/US-001-entity-model.md, Relationships —
// "None"), so truncating it is sufficient to isolate one test from the next.
// No sequence to reset (`id` is a client-generated UUID, not a serial) and no
// dependent table to cascade to (docs/designs/database/US-001-db-design.md,
// Test database).
//
// Call this from a `beforeEach` in every integration test file that touches
// the database — never assume the table starts empty, and never rely on
// Vitest's serial `integration` execution (fileParallelism: false, D-10) as a
// substitute for actually clearing state between tests.
//
// Never imported by src/ (docs/architecture/module-map.md, Test placement
// rule).

import { prisma } from '../../src/lib/prisma.js';

export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "user";');
}
