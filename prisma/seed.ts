import { env } from '../apps/api/src/config/env.js';
import { prisma } from '../apps/api/src/database/prisma.js';
import { seedDevelopmentData } from './seed-data.js';

try {
  if (env.nodeEnv !== 'development') {
    throw new Error('The development seed requires NODE_ENV=development.');
  }

  await seedDevelopmentData(prisma);
  console.info(
    'Development seed complete: one demo user, two projects, five tasks.',
  );
} catch {
  // Avoid exposing connection credentials or password hashes in CLI output.
  console.error(
    'Development seed failed. Check NODE_ENV, DATABASE_URL, and migrations.',
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
