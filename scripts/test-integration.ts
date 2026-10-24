import { runCommand, workspaceRoot as root } from './run-command.js';
import { testEnvironment } from '../apps/api/test/environment.js';

const environment = { ...process.env, ...testEnvironment };

function run(script: string, args: string[], cwd = root) {
  runCommand(process.execPath, [script, ...args], {
    cwd,
    env: environment,
  });
}

run(`${root}/node_modules/prisma/build/index.js`, ['migrate', 'deploy']);
run(
  `${root}/node_modules/vitest/vitest.mjs`,
  [
    'run',
    ...(process.argv.includes('--coverage')
      ? ['--coverage']
      : ['.integration.test.ts']),
  ],
  `${root}/apps/api`,
);
