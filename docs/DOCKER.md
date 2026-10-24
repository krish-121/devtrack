# Docker build and runtime

DevTrack remains one modular monolith: one Express process serves the REST API
and built React frontend on one origin. PostgreSQL is a separate dependency.
Development still uses host Vite/Express watchers and Compose PostgreSQL.

## Build and verify locally

```sh
docker build --tag devtrack:local .
npm run test:docker
```

The second command builds the image, starts a disposable E2E PostgreSQL service,
applies migrations, runs both Chromium workflows against the container, verifies
default production-mode behavior, and cleans up its containers/test data. It
requires local npm dependencies and `npx playwright install chromium`. See
[TESTING.md](TESTING.md) for isolation, ports, recovery and exact checks.

## Image contents and build stages

The base image is deliberately versioned `node:24.18.0-bookworm-slim`, with
npm 11.16.0 and OpenSSL. Update this tag intentionally for security maintenance;
it is not a floating `latest` dependency.

1. Manifest/dependency stages use the repository lockfile and `npm ci`.
2. The build stage generates Prisma Client and runs the production workspace
   build: shared JavaScript/types, compiled API, then static frontend.
3. A separate production-dependencies stage selects only API/shared workspaces,
   omits development and optional/peer-only packages, and retains locked runtime
   packages. Optional Prisma CLI/TypeScript peers and Prisma Studio do not belong
   in the application runtime. Native Argon2 loads from its packaged prebuild.
4. The final runtime copies production node_modules, compiled API/generated
   client, shared output/package manifests, and the built web assets. It runs as
   `node` (UID 1000), with `node apps/api/dist/server.js` as the direct process.

Root development postinstall is skipped in manifest-only stages because its
schema/tools have not been copied yet. Prisma generation happens explicitly in
the build stage; runtime startup does not require Prisma CLI or TypeScript.
The production workspace selection changes only the staged root manifest, not
the repository manifest/lockfile. `.dockerignore` excludes local env files,
secrets, credentials, node_modules, build/test artifacts, Git and agent metadata.
No build argument carries a production credential.

The root `npm run build` wrapper explicitly supplies `NODE_ENV=production` to
workspace builds. This prevents test/development shell settings from producing
a development React bundle. It preserves the existing workspace build order.

## Runtime configuration

Set real values through the runtime environment, not Dockerfile/source. The
image defaults to `NODE_ENV=production` and `PORT=3000`; PORT can be overridden.
Required variables are `DATABASE_URL` and the actual HTTPS `APP_ORIGIN`.
`LOG_LEVEL` and `AUTH_RATE_LIMIT_MAX` keep their existing validated meanings.
Existing opaque database sessions do not use a signing secret; no unused
`AUTH_SECRET` or deployment-specific configuration was introduced.

For a future real environment, create a private `.env.production.local` file
(ignored by Git) with the correct values, including PORT=8080 for this example:

```sh
docker run --detach --name devtrack --publish 127.0.0.1:8080:8080 --env-file .env.production.local devtrack:local
docker logs devtrack
```

The database URL must be reachable **from the container**. `localhost` in it
means the application container itself. Use the database's network DNS name,
managed endpoint, or Docker Desktop's `host.docker.internal` for an intentionally
configured host database. Publish only the port/interface you intend to expose.
Production expects HTTPS termination in front of Express and its exact public
origin for browser requests. Local HTTP browser auth is covered only in the
disposable test environment; do not change production security policy to make a
plain HTTP demo work.

`GET /api/v1/health` is liveness, not a database readiness guarantee. Docker's
health check uses it and the configured PORT. Application logs use stdout/stderr.
`SIGTERM`/`SIGINT` stop accepting requests, finish in-flight HTTP requests and
disconnect Prisma. A ten-second deadline prevents shutdown hanging indefinitely.

The server routes `/api` before static files. Unknown APIs return JSON 404s.
Direct HTML navigation such as `/projects/<uuid>` serves index.html with
`no-cache`; fingerprinted `/assets` files get immutable caching. Missing files,
dotfiles and non-HTML requests do not receive a fake successful SPA document.
Helmet's existing security headers remain enabled.

## Migrations are explicit

Never seed production or run `migrate dev` at container startup. Apply reviewed
migrations with `prisma migrate deploy` as a separate authorized operation before
running a new application version. The slim runtime deliberately omits Prisma
CLI, migration sources and build tooling.

The existing build stage can be used as a separate tools image if needed:

```sh
docker build --target build --tag devtrack:migrations .
docker run --rm --env-file .env.production.local devtrack:migrations node node_modules/prisma/build/index.js migrate deploy
```

This is a documented operation, not an automatic deploy/seed step. The current
task executed migrations only against disposable test databases. Harness,
registry publishing and cloud deployment remain later phases.

The build follows the official [Docker Node.js guide](https://docs.docker.com/guides/nodejs/)
and [npm ci semantics](https://docs.npmjs.com/cli/v11/commands/npm-ci/).
