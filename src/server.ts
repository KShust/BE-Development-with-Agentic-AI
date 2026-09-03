// Process entry point (module-map.md): starts the HTTP server and shuts it down
// gracefully on SIGTERM / SIGINT, including the Prisma disconnect (FR-20). The
// Express app carries no `listen()` of its own (AD-9).

import { createServer } from 'node:http';

import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { disconnectPrisma } from './lib/shutdown.js';

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server listening');
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
  await disconnectPrisma();

  process.exit(0);
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}
