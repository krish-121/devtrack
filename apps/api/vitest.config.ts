import { defineConfig } from 'vitest/config';
import { testEnvironment } from './test/environment.js';

export default defineConfig({
  test: {
    environment: 'node',
    env: testEnvironment,
    include: ['src/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/generated/**', 'src/server.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 75,
        'src/modules/**/*.service.ts': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 85,
        },
      },
    },
  },
});
