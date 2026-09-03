// Prisma 7 migration connection configuration (persistence-conventions.md PC-1,
// plan D-2).
//
// Prisma 7 rejects `url` in the schema's `datasource` block (P1012): the
// migration connection string now lives here. This file reads no `process.env`
// — `prisma/config` exports its own `env()` helper, which resolves the value
// and throws `PrismaConfigEnvError` naming the variable when it is unset. That
// keeps architecture.md AD-7's "process.env only in src/config/env.ts" literally
// true with no amendment, while still failing fast on a missing variable.
//
// The client half of the connection (src/lib/prisma.ts) is configured
// separately, through the @prisma/adapter-pg driver adapter.

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: env('DATABASE_URL') },
});
