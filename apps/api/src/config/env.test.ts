import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('environment configuration', () => {
  const databaseUrl =
    'postgresql://devtrack:example@localhost:5432/devtrack_dev';

  it('requires database configuration and defaults optional settings', () => {
    expect(parseEnv({ DATABASE_URL: databaseUrl })).toEqual({
      appVersion: 'development',
      nodeEnv: 'development',
      port: 3000,
      logLevel: 'info',
      databaseUrl,
      appOrigin: 'http://localhost:5173',
      authRateLimitMax: 20,
      trustProxyHops: 0,
    });
  });

  it('uses valid overrides and converts the port to a number', () => {
    expect(
      parseEnv({
        DATABASE_URL: databaseUrl,
        NODE_ENV: 'production',
        APP_ORIGIN: 'https://devtrack.example',
        PORT: '8080',
        LOG_LEVEL: 'warn',
        APP_VERSION: '0123456789abcdef0123456789abcdef01234567',
        TRUST_PROXY_HOPS: '1',
      }),
    ).toEqual({
      appVersion: '0123456789abcdef0123456789abcdef01234567',
      nodeEnv: 'production',
      port: 8080,
      logLevel: 'warn',
      databaseUrl,
      appOrigin: 'https://devtrack.example',
      authRateLimitMax: 20,
      trustProxyHops: 1,
    });
  });

  it.each(['', '0', '-1', '65536', '3000.5', 'not-a-port'])(
    'rejects the invalid port %j with a useful configuration error',
    (port) => {
      expect(() => parseEnv({ DATABASE_URL: databaseUrl, PORT: port })).toThrow(
        /Invalid environment configuration: PORT:/,
      );
    },
  );

  it('rejects an unsupported runtime environment', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, NODE_ENV: 'staging' }),
    ).toThrow(/NODE_ENV:/);
  });

  it.each(['latest', 'abcdef0', 'ABCDEF0123456789abcdef0123456789abcdef0123'])(
    'rejects an untraceable or malformed application version %j',
    (appVersion) => {
      expect(() =>
        parseEnv({ DATABASE_URL: databaseUrl, APP_VERSION: appVersion }),
      ).toThrow(/APP_VERSION:/);
    },
  );

  it('requires an HTTPS origin in production and rejects malformed origins', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, NODE_ENV: 'production' }),
    ).toThrow(/HTTPS/);
    for (const origin of [
      'https://devtrack.example/path',
      'https://devtrack.example/',
      'https://user:secret@devtrack.example',
      'not-an-origin',
    ])
      expect(() =>
        parseEnv({ DATABASE_URL: databaseUrl, APP_ORIGIN: origin }),
      ).toThrow(/APP_ORIGIN/);
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, AUTH_RATE_LIMIT_MAX: '0' }),
    ).toThrow(/AUTH_RATE_LIMIT_MAX/);
  });

  it('rejects an unsupported log level', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: databaseUrl, LOG_LEVEL: 'verbose' }),
    ).toThrow(/LOG_LEVEL:/);
  });

  it.each(['true', '-1', '1.5', '6'])(
    'rejects an unsafe or invalid trusted proxy count %j',
    (hops) => {
      expect(() =>
        parseEnv({ DATABASE_URL: databaseUrl, TRUST_PROXY_HOPS: hops }),
      ).toThrow(/TRUST_PROXY_HOPS:/);
    },
  );

  it.each([
    undefined,
    '',
    'not-a-url',
    'https://localhost/devtrack',
    'postgresql://localhost',
  ])('rejects an invalid or missing database URL (%j)', (value) => {
    expect(() => parseEnv({ DATABASE_URL: value })).toThrow(/DATABASE_URL:/);
  });

  it('does not expose credentials in configuration errors', () => {
    const parseInvalidUrl = () =>
      parseEnv({
        DATABASE_URL: 'https://user:private-password@localhost/devtrack',
      });
    expect(parseInvalidUrl).toThrow(
      /Invalid environment configuration: DATABASE_URL:/,
    );
    expect(parseInvalidUrl).not.toThrow(/private-password/);
  });
});
