import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));

export function runCommand(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; cwd?: string; capture?: boolean } = {},
) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: options.env ?? process.env,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${command} failed (${result.status ?? result.signal}): ${result.stderr ?? ''}`,
    );
  return result.stdout ?? '';
}
