import { runCommand } from './run-command.js';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this script through npm run build.');
// Vite must produce the same production bundle even from a test/dev shell.
runCommand(process.execPath, [npmCli, 'run', 'build', '--workspaces'], {
  env: { ...process.env, NODE_ENV: 'production' },
});
