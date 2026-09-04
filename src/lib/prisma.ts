// The single PrismaClient instance for the whole application
// (persistence-conventions.md PC-1). No other file constructs a client, and the
// eslint PRISMA rule makes this the only file in src/ allowed to import
// `@prisma/client`.
//
// Prisma 7 requires a driver adapter on a direct database connection: the
// connection string reaches the client through @prisma/adapter-pg (approved
// under SC-6, commit 0339b4a), not through a `url` in the schema. Migrations get
// their own copy of the URL from prisma.config.ts.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';

const adapter = new PrismaPg(env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });

/** Closes the connection pool — called by src/server.ts on graceful shutdown (FR-20). */
export function disconnectPrisma(): Promise<void> {
  return prisma.$disconnect();
}
