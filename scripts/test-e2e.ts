import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { e2eEnvironment } from '../e2e/environment.js';
import { runCommand, workspaceRoot } from './run-command.js';

const dockerMode = process.argv.includes('--docker');
const npmCli = process.env.npm_execpath;
if (!npmCli)
  throw new Error('Run this script through npm run test:e2e or test:docker.');
const environment = {
  ...process.env,
  ...e2eEnvironment,
  DEVTRACK_E2E_DOCKER: dockerMode ? '1' : '0',
};
const compose = [
  'compose',
  '--project-name',
  'devtrack-e2e',
  '--env-file',
  '.env.example',
  '--profile',
  'e2e',
];
const containerName = `devtrack-e2e-${process.pid}`;
const imageVersion = '0123456789abcdef0123456789abcdef01234567';
const socketMount =
  'type=volume,source=devtrack-e2e_postgres-socket-e2e,target=/cloudsql/devtrack-test,readonly';
const containerDatabaseUrl =
  'postgresql://devtrack:devtrack_e2e@localhost/devtrack_e2e?host=%2Fcloudsql%2Fdevtrack-test';
let containerStarted = false;
function run(command: string, args: string[], capture = false) {
  return runCommand(command, args, { env: environment, capture });
}
async function waitForHealth() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch('http://localhost:4174/api/v1/health', {
        signal: AbortSignal.timeout(1000),
      });
      if (
        response.ok &&
        run(
          'docker',
          ['inspect', '--format', '{{.State.Health.Status}}', containerName],
          true,
        ).trim() === 'healthy'
      )
        return;
    } catch {
      /* The new container may still be starting. */
    }
    await setTimeout(500);
  }
  run('docker', ['logs', containerName]);
  throw new Error('Container failed its health smoke check.');
}
function removeContainer() {
  if (!containerStarted) return;
  run('docker', ['stop', '--timeout', '15', containerName]);
  const exitCode = run(
    'docker',
    ['inspect', '--format', '{{.State.ExitCode}}', containerName],
    true,
  ).trim();
  run('docker', ['rm', containerName]);
  containerStarted = false;
  assert.equal(exitCode, '0', 'Container must stop cleanly after SIGTERM');
}
function startContainer(production: boolean) {
  run('docker', [
    'run',
    '--detach',
    '--name',
    containerName,
    '--network',
    'devtrack-e2e_default',
    '--publish',
    `127.0.0.1:4174:${production ? '8080' : '3000'}`,
    '--mount',
    socketMount,
    '--health-interval',
    '1s',
    '--env',
    `PORT=${production ? '8080' : '3000'}`,
    '--env',
    `APP_ORIGIN=${production ? 'https://devtrack.example.test' : 'http://localhost:4174'}`,
    '--env',
    `DATABASE_URL=${containerDatabaseUrl}`,
    ...(production
      ? []
      : ['--env', 'NODE_ENV=test', '--env', 'AUTH_RATE_LIMIT_MAX=1000']),
    'devtrack:local',
  ]);
  containerStarted = true;
}
try {
  run('docker', [...compose, 'up', '-d', '--wait', 'db-e2e']);
  if (dockerMode) {
    run('docker', [
      'build',
      '--target',
      'migrations',
      '--build-arg',
      `APP_VERSION=${imageVersion}`,
      '--tag',
      'devtrack-migrations:local',
      '.',
    ]);
    const migrationArguments = [
      'run',
      '--rm',
      '--network',
      'none',
      '--mount',
      socketMount,
      '--env',
      'APP_ORIGIN=https://devtrack.example.test',
      '--env',
      `DATABASE_URL=${containerDatabaseUrl}`,
      'devtrack-migrations:local',
    ];
    // A fresh database is migrated by the release-tools container, using the
    // same Unix socket URL form as Cloud Run. A second release is a safe no-op.
    run('docker', migrationArguments);
    run('docker', migrationArguments);
    run('docker', [
      'build',
      '--build-arg',
      `APP_VERSION=${imageVersion}`,
      '--tag',
      'devtrack:local',
      '.',
    ]);
    startContainer(false);
    await waitForHealth();
  } else {
    run(process.execPath, [
      `${workspaceRoot}/node_modules/prisma/build/index.js`,
      'migrate',
      'deploy',
    ]);
    run(process.execPath, [npmCli, 'run', 'build']);
  }
  run(process.execPath, [
    `${workspaceRoot}/node_modules/@playwright/test/cli.js`,
    'test',
  ]);
  if (dockerMode) {
    removeContainer();
    // Verify the default production settings separately; browser auth over local
    // HTTP above used test mode, preserving HTTPS/Secure cookie policy in prod.
    startContainer(true);
    await waitForHealth();
    assert.equal(
      run(
        'docker',
        [
          'image',
          'inspect',
          '--format',
          '{{index .Config.Labels "org.opencontainers.image.revision"}}',
          'devtrack:local',
        ],
        true,
      ).trim(),
      imageVersion,
    );
    const smokeArguments = [
      '--import',
      'tsx',
      `${workspaceRoot}/scripts/smoke-deployment.ts`,
      'http://localhost:4174',
    ];
    run(process.execPath, [...smokeArguments, imageVersion]);
    assert.throws(
      () => run(process.execPath, [...smokeArguments, 'f'.repeat(40)], true),
      /Deployed version does not match/,
    );
    const page = await fetch('http://localhost:4174/projects/example');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<div id="root"><\/div>/);
    assert.ok(page.headers.get('content-security-policy'));
    const missing = await fetch('http://localhost:4174/api/v1/missing');
    assert.equal(missing.status, 404);
    assert.match(
      missing.headers.get('content-type') ?? '',
      /application\/json/,
    );
    assert.equal(
      (await fetch('http://localhost:4174/api/v1/dashboard/summary')).status,
      401,
    );
    const registered = await fetch(
      'http://localhost:4174/api/v1/auth/register',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://devtrack.example.test',
        },
        body: JSON.stringify({
          name: 'Production smoke',
          email: `production-smoke-${process.pid}@devtrack.example.test`,
          password: 'Public production smoke passphrase',
        }),
      },
    );
    assert.equal(registered.status, 201);
    const cookie = registered.headers.get('set-cookie');
    assert.ok(cookie, 'Expected a production session cookie.');
    assert.ok(cookie.includes('Secure'));
    assert.ok(cookie.includes('HttpOnly'));
    const current = await fetch('http://localhost:4174/api/v1/auth/me', {
      headers: { Cookie: cookie.split(';')[0] ?? '' },
    });
    assert.equal(current.status, 200);
    assert.equal(
      run(
        'docker',
        ['exec', containerName, 'node', '-p', 'process.getuid()'],
        true,
      ).trim(),
      '1000',
    );
    run('docker', [
      'exec',
      containerName,
      'node',
      '--input-type=module',
      '-e',
      'import { existsSync } from "node:fs"; for (const path of [".env", "apps/api/src", "node_modules/typescript", "node_modules/@playwright", "node_modules/prisma", "node_modules/react"]) { if (existsSync(path)) throw new Error("Unexpected runtime file: " + path); }',
    ]);
    console.log(
      'Production image smoke checks passed: SPA/API, configured PORT, non-root user, runtime contents, HTTPS policy preserved.',
    );
  }
} finally {
  try {
    removeContainer();
  } finally {
    run('docker', [...compose, 'stop', 'db-e2e']);
  }
}
