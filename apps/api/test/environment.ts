// Public credentials for the disposable, loopback-only Compose test service.
// Never inherit DATABASE_URL from a developer's shell or .env in tests.
export const testEnvironment = {
  APP_VERSION: 'development',
  TRUST_PROXY_HOPS: '0',
  NODE_ENV: 'test',
  APP_ORIGIN: 'http://localhost:5173',
  AUTH_RATE_LIMIT_MAX: '1000',
  DATABASE_URL:
    'postgresql://devtrack:devtrack_test@localhost:5433/devtrack_test',
};
