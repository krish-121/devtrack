import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runCommand, workspaceRoot } from './run-command.js';

const repository = process.argv[2] ?? 'devtrack';
if (!/^[a-z0-9][a-z0-9._/-]*$/.test(repository))
  throw new Error('Use a Docker image repository without a tag or digest.');
if (runCommand('git', ['status', '--porcelain'], { capture: true }).trim())
  throw new Error(
    'Commit reviewed changes before building a traceable artifact.',
  );

const commit = runCommand('git', ['rev-parse', 'HEAD'], {
  capture: true,
}).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected a full Git SHA.');
const image = `${repository}:${commit}`;
runCommand('docker', [
  'build',
  '--build-arg',
  `APP_VERSION=${commit}`,
  '--tag',
  image,
  '.',
]);
const revision = runCommand(
  'docker',
  [
    'image',
    'inspect',
    '--format',
    '{{index .Config.Labels "org.opencontainers.image.revision"}}',
    image,
  ],
  { capture: true },
).trim();
if (revision !== commit) throw new Error('Image revision does not match Git.');
const imageId = runCommand(
  'docker',
  ['image', 'inspect', '--format', '{{.Id}}', image],
  { capture: true },
).trim();
mkdirSync(join(workspaceRoot, '.ci'), { recursive: true });
writeFileSync(
  join(workspaceRoot, '.ci/local-artifact.json'),
  JSON.stringify({ commit, image, imageId }, null, 2) + '\n',
);
console.log(
  `Built ${image}; local image ID ${imageId}. Nothing was published.`,
);
