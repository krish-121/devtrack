import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './logging/logger.js';
import { prisma } from './database/prisma.js';

const webDirectory = fileURLToPath(new URL('../../web/dist/', import.meta.url));
const app = createApp(env.nodeEnv === 'development' ? undefined : webDirectory);

const server = app.listen(env.port);

server.on('listening', () => {
  logger.info({ port: env.port }, 'DevTrack API is listening');
});

server.on('error', (error) => {
  logger.fatal({ err: error }, 'Failed to start the API');
  process.exitCode = 1;
});

let stopping = false;
function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, 'Stopping DevTrack');
  const deadline = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  deadline.unref();
  server.close(() => {
    void prisma.$disconnect().then(
      () => {
        clearTimeout(deadline);
        logger.info('DevTrack stopped');
      },
      (error: unknown) => {
        logger.error({ err: error }, 'Database shutdown failed');
        process.exitCode = 1;
      },
    );
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
