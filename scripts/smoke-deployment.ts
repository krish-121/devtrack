import { healthResponseSchema, versionResponseSchema } from '@devtrack/shared';

const [target, expectedVersion] = process.argv.slice(2);
if (!target || !expectedVersion || !/^[a-f0-9]{40}$/.test(expectedVersion))
  throw new Error(
    'Usage: npm run smoke:deployment -- https://service-origin FULL_COMMIT_SHA',
  );

const origin = new URL(target);
const localHttp =
  origin.protocol === 'http:' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
if (origin.origin !== target || (origin.protocol !== 'https:' && !localHttp))
  throw new Error('Use an HTTPS origin without a path or credentials.');

async function readJson(path: string): Promise<unknown> {
  const response = await fetch(new URL(path, origin), {
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`${path} returned HTTP ${response.status}.`);
  return response.json();
}

healthResponseSchema.parse(await readJson('/api/v1/health'));
const version = versionResponseSchema.parse(await readJson('/api/v1/version'));
if (version.data.version !== expectedVersion)
  throw new Error('Deployed version does not match the released commit.');

const page = await fetch(origin, {
  redirect: 'error',
  signal: AbortSignal.timeout(15_000),
});
if (!page.ok || !/<div id="root"><\/div>/.test(await page.text()))
  throw new Error('The deployed frontend did not load.');

console.log(
  `Deployment smoke passed for ${origin.origin} at ${expectedVersion}.`,
);
