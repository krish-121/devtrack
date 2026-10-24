import { z } from 'zod';

const envSchema = z.object({
  APP_VERSION: z
    .string()
    .regex(
      /^(development|[a-f0-9]{40})$/,
      'Use a full lowercase Git commit SHA.',
    )
    .default('development'),
  APP_ORIGIN: z
    .url({ protocol: /^https?$/ })
    .refine(
      (value) => URL.canParse(value) && new URL(value).origin === value,
      'Use only the origin, without a path or trailing slash.',
    )
    .default('http://localhost:5173'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(20),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z
    .url({ protocol: /^postgres(ql)?$/, hostname: /.+/ })
    .pipe(
      z
        .string()
        .refine(
          (value) => new URL(value).pathname.length > 1,
          'Must include a database name',
        ),
    ),
});

export function parseEnv(environment: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(environment);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (
    result.data.NODE_ENV === 'production' &&
    !result.data.APP_ORIGIN.startsWith('https://')
  )
    throw new Error(
      'Invalid environment configuration: APP_ORIGIN must use HTTPS in production.',
    );

  return {
    appVersion: result.data.APP_VERSION,
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
    databaseUrl: result.data.DATABASE_URL,
    appOrigin: result.data.APP_ORIGIN,
    authRateLimitMax: result.data.AUTH_RATE_LIMIT_MAX,
    trustProxyHops: result.data.TRUST_PROXY_HOPS,
  };
}

export const env = parseEnv(process.env);
