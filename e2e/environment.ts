// Public credentials for a separate disposable service, never the developer DB.
export const e2eEnvironment = {
  NODE_ENV: 'test',
  PORT: '4173',
  APP_ORIGIN: 'http://localhost:4173',
  LOG_LEVEL: 'silent',
  AUTH_RATE_LIMIT_MAX: '1000',
  DATABASE_URL:
    'postgresql://devtrack:devtrack_e2e@localhost:5434/devtrack_e2e',
};
