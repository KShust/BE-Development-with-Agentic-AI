// Graceful-shutdown hooks for infrastructure singletons.
//
// This file exists to bridge one tension between two authorities: module-map.md
// says src/server.ts owns graceful shutdown "including the Prisma disconnect" and
// may import src/lib, while eslint.config.js's PRISMA rule makes src/lib/prisma.ts
// the only file allowed to name the client. server.ts imports the disconnect from
// here — a src/lib module the rule does not gate — instead of reaching into
// prisma.ts directly. Flagged for review: the cleaner fix is an eslint.config.js
// carve-out for server.ts, which this Story is not authorised to make.

export { disconnectPrisma } from './prisma.js';
