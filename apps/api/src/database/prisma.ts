import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
  connectionTimeoutMillis: 5_000,
});

// One pool per process; feature repositories will reuse this client.
export const prisma = new PrismaClient({ adapter });
