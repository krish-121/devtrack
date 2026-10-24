import { env } from '../apps/api/src/config/env.js';
import { runCommand, workspaceRoot } from './run-command.js';

// This entry point intentionally does not load the developer's .env file.
// The validated environment must already contain the release's database URL.
if (env.nodeEnv !== 'production' || env.appVersion === 'development')
  throw new Error(
    'Production migrations require production mode and a full SHA.',
  );

runCommand(process.execPath, [
  `${workspaceRoot}/node_modules/prisma/build/index.js`,
  'migrate',
  'deploy',
]);
