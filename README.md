# DevTrack

A learning-focused project and task management application. This repository
currently implements **Phases 1–12**: repository tooling, PostgreSQL/Prisma,
cookie-based authentication, projects, tasks, a real dashboard, and application
feedback/accessibility polish, testing hardening, a production Docker image,
and a GitHub PR workflow with verified Harness CI.
Phase 13/14 release code and protected-trial cloud resources are set up.
Harness has published both full-SHA image tags; verification caught a missing
baked version and a CD authentication error before migration or deployment.
Those fixes and live Cloud Run verification remain pending. These phases are
not complete end to end.
The UI supports task status, priority, optional
due dates, server-side search/filtering, and real project progress.

See the [Phase 13/14 status](docs/PHASE_13_14.md),
[deployment setup and trial lifecycle](docs/DEPLOYMENT.md),
[phase status and learning walkthrough](docs/PROJECT_PROGRESS.md) and the
[implemented API contract](docs/API.md). See the
[Phase 11/12 report and CI proof](docs/PHASE_11_12.md) for the latest changes,
[GitHub workflow](docs/GITHUB_WORKFLOW.md), [Harness guide](docs/HARNESS.md),
[Phase 9/10 report and learning notes](docs/PHASE_09_10.md),
[testing guide](docs/TESTING.md), [Docker guide](docs/DOCKER.md),
[Phase 7/8 report](docs/PHASE_07_08.md),
and the [Phase 5/6 report](docs/PHASE_05_06.md) for authentication and tasks.

[PROJECT_SPEC.md](docs/PROJECT_SPEC.md) is the engineering source of truth.

## Local setup

Use **Node.js 24.18.0** (pinned in `.nvmrc`), **npm 11.16.0**, and Docker Desktop
with its Linux container engine running.
Run commands from the repository root:

```sh
npm ci
```

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell, or
`cp .env.example .env` on macOS/Linux), then run:

```sh
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:5173> for the web app. The API listens on port 3000 by
default. Check <http://localhost:3000/api/v1/health> directly or
<http://localhost:5173/api/v1/health> through Vite's development proxy:

```json
{ "data": { "status": "ok" } }
```

This is a liveness check: it confirms that Express can respond, without checking
a database or other dependencies. Stop development servers with Ctrl+C.

Open the app and create an account, then create a project and its tasks. Login
opens the dashboard with your actual project/task totals and recent progress.
Successful project/task changes refresh that summary. Log out
from the account control in the header. Each account sees only its own data.
The old `DEV_USER_ID` shortcut has been removed; remove it from older `.env` files.
Set `APP_ORIGIN=http://localhost:5173` for local browser requests. Restart after
environment changes. Existing seeded records are preserved, but their discarded
random password does not provide a demo login; a new account starts empty.

### Environment settings

The API requires `DATABASE_URL`. Copy `.env.example` to `.env` at the repository
root before starting the API/database:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`.

| Variable              | Default                 | Meaning                                                                     |
| --------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `NODE_ENV`            | `development`           | `development`, `test`, or `production`                                      |
| `PORT`                | `3000`                  | API port, an integer from 1 through 65535                                   |
| `LOG_LEVEL`           | `info`                  | Pino level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent` |
| `DATABASE_URL`        | Required                | PostgreSQL connection URL including a host and database name                |
| `APP_ORIGIN`          | `http://localhost:5173` | Exact browser origin without trailing slash; requires HTTPS in production   |
| `AUTH_RATE_LIMIT_MAX` | `20`                    | Combined login/register attempts per IP per 15 minutes                      |
| `APP_VERSION`         | `development`           | Full lowercase Git SHA baked into release images; public version metadata   |
| `TRUST_PROXY_HOPS`    | `0`                     | Trusted reverse-proxy hop count, 0–5; review the actual ingress topology    |
| `POSTGRES_PASSWORD`   | Required by Compose     | Local database password; must match the password in `DATABASE_URL`          |

The API's dev/start commands load the root `.env` using Node's built-in loader;
values already set in the process environment take precedence. Zod validates
configuration before the API starts. Tests do not load your local `.env`.
Restart development servers after changing environment settings.

Vite reads the root `PORT` setting for its `/api` proxy. The browser uses the
web server's origin, so no cross-origin permissions are needed. Backend
configuration is not injected into browser code. The web port is fixed at 5173;
startup fails clearly if it is occupied. Keep API and web ports different.

`.env` files, credentials, dependency folders, and build outputs are ignored by
Git. `.env.example` contains only public local example credentials. They are not
production credentials. If a password contains special URL characters,
percent-encode it in `DATABASE_URL`.

### Database setup

`db:up` starts only PostgreSQL 18.6 and waits for it to be ready. The development
database is `devtrack_dev` on `127.0.0.1:5432`; its named Docker volume persists
when the container stops. `npm run db:stop` stops it without deleting data.
React and Express still run on the host.

The seed creates one demo user, two projects, and five tasks. It uses a transaction
and stable IDs, so rerunning it fills missing demo records without overwriting
existing edits or duplicating records. It requires `NODE_ENV=development` and is
never run automatically. The stored demo user's Argon2id hash comes from a
discarded random password. Registration does not claim or transfer seeded data.

See [DATABASE.md](docs/DATABASE.md) for the relational model, constraints,
migration workflow, test isolation, SQL examples, and troubleshooting.

## Commands

| Command                                             | Purpose                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                                       | Run the web and API watchers together; stop both when either exits             |
| `npm run dev:web`                                   | Run Vite only                                                                  |
| `npm run dev:api`                                   | Run the TypeScript API watcher only                                            |
| `npm run lint`                                      | Lint all workspaces and tool configuration; warnings fail the check            |
| `npm run format`                                    | Format repository code and configuration                                       |
| `npm run format:check`                              | Check formatting without editing files                                         |
| `npm run typecheck`                                 | Check every workspace, including API tests                                     |
| `npm test`                                          | Run environment, frontend workflow, and HTTP client tests without PostgreSQL   |
| `npm run test:integration`                          | Start the isolated test DB, apply migrations, and run HTTP/database/seed tests |
| `npm run test:coverage`                             | API + real PostgreSQL and frontend coverage, with quality thresholds           |
| `npm run test:e2e`                                  | Build and run two Chromium workflows using a disposable database               |
| `npm run test:docker`                               | Build/run the image, run browser workflows, verify production smoke checks     |
| `npm run artifact:build -- [image-repository]`      | Build a clean committed SHA-tagged image locally and record its image ID       |
| `npm run smoke:deployment -- HTTPS_ORIGIN FULL_SHA` | Check deployed health, exact commit version and frontend                       |
| `npm run db:migrate:production`                     | Apply reviewed migrations once using explicit production environment/secret    |
| `npm run build`                                     | Build shared JavaScript/declarations, the API, and the web app, in that order  |
| `npm start`                                         | Run the compiled API after building                                            |
| `npm run preview --workspace @devtrack/web`         | Preview the built web app locally                                              |
| `npm run db:up`                                     | Start the development PostgreSQL service and wait for readiness                |
| `npm run db:stop`                                   | Stop development PostgreSQL, preserving its volume                             |
| `npm run db:generate`                               | Regenerate Prisma Client after schema edits; also runs after install           |
| `npm run db:validate`                               | Validate the Prisma schema                                                     |
| `npm run db:format`                                 | Format the Prisma schema                                                       |
| `npm run db:migrate -- --name meaningful_name`      | Create/apply development migrations                                            |
| `npm run db:status`                                 | Inspect development migration status                                           |
| `npm run db:seed`                                   | Explicitly load development demo data                                          |
| `npm run db:test:up`                                | Start the separate disposable PostgreSQL test service on port 5433             |
| `npm run db:test:stop`                              | Stop the test service and discard its in-memory data                           |

Before committing, run:

```sh
npm run format:check
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:coverage
npm run test:e2e
npm run build
npm run test:docker
```

Use `npm ci` for reproducible installs from `package-lock.json`; use `npm install`
when deliberately changing dependencies. Prettier leaves the supplied
`AGENTS.md` and `docs/PROJECT_SPEC.md` unchanged.

## Structure and responsibilities

```text
apps/web/
  src/app/App.tsx              Protected application layout and routes
  src/pages/                  Dashboard, auth, project list/detail/create/edit
  src/components/ui/          Shared loading/error feedback and confirmation focus
  src/features/dashboard/     Summary API, query hook, and behavior tests
  src/features/projects/      Project API, query hooks, forms, progress, deletion
  src/features/auth/          Current-user query, sign-in/out API and cache cleanup
  src/features/tasks/         Task API, query hooks, forms, board and filters
  src/pages/AuthPage/         Login and registration forms
  src/lib/api/client.ts       One HTTP client with validated JSON and API errors
  src/lib/query/client.ts     TanStack Query defaults
  src/lib/forms/              Focus for invalid forms and server errors
  src/main.tsx                 Browser entry point
  src/styles/global.css       Small shared styling layer
  vite.config.ts              Vite and the local API proxy
apps/api/
  src/app.ts                  Express application and middleware registration
  src/server.ts               HTTP listener and startup logging
  src/config/env.ts           Centralized, validated runtime configuration
  src/database/prisma.ts      One shared Prisma Client/connection pool per process
  src/generated/prisma/       Generated database client (ignored by Git)
  src/modules/health/         Health route and thin controller
  src/modules/version/        Public commit metadata route and thin controller
  src/modules/projects/       Project routes, schemas, controllers, services, repository
  src/modules/auth/           Auth routes, session/password services and persistence
  src/modules/tasks/          Owner-scoped task CRUD, filtering and persistence
  src/modules/dashboard/      Owner-scoped summary controller/service/repository
  src/errors/app-error.ts     Known application errors
  src/middleware/             JSON 404 and unexpected-error responses
  src/logging/logger.ts       Pino logger
packages/shared/
  src/api.ts                  Health, version and error response contracts
  src/project.ts              Project request and response DTO contracts
  src/auth.ts                 Shared authentication schemas and DTOs
  src/task.ts                 Shared task schemas, statuses, priorities and DTOs
  src/dashboard.ts            Dashboard runtime schema and derived DTO types
  src/index.ts                Public schemas and type exports
prisma/
  schema.prisma               User, Session, Project, Task, relationships and indexes
  migrations/                 Reviewed SQL history, including CHECK constraints
  seed.ts                     Development-only seed entry point
  seed-data.ts                Transactional, repeatable demo data
scripts/build.ts              Deterministic production workspace build
scripts/test-integration.ts   Migrate the isolated test DB and run integrations/coverage
scripts/test-e2e.ts           Isolated browser and Docker verification lifecycle
scripts/build-artifact.ts     Clean-commit image build and local receipt
scripts/migrate-production.ts Explicit production migration entry point
scripts/smoke-deployment.ts   External health/version/frontend verification
infrastructure/harness/       PR/release pipeline and trigger definitions
infrastructure/cloud-run/     Single-container production service manifest
e2e/                          Two real browser workflows and fixed test configuration
playwright.config.ts          Chromium configuration; never reuse a development server
Dockerfile                    Multi-stage build and non-root production runtime
docker-compose.yml            Development, integration, and E2E PostgreSQL services
prisma.config.ts              Prisma CLI configuration and root .env loading
tsconfig.base.json            Common strict TypeScript rules
eslint.config.js              Shared lint configuration
.prettierrc.json              Shared formatting configuration
```

`app.ts` configures Express without starting a listener. `server.ts` owns process
startup. Supertest imports `app.ts` and manages its own temporary server, so the
tests need no separately running API or fixed port.

The health controller only returns a response. It needs no service, repository,
or request schema because it has no business rules, persistence, or input.
Add those layers when a feature has a responsibility for them. Unknown routes
return JSON 404 errors; unexpected errors are logged and return a generic JSON
500 without stack traces. Helmet configures common security response headers.

`@devtrack/shared` now exports runtime Zod schemas as well as types. Shared auth
and task validation keeps the browser/API rules and critical enum values aligned.
Install, dev, and test commands build this package before runtime consumers;
the root production build builds it first. After editing shared schemas during
development, run `npm run build --workspace @devtrack/shared` to update runtime
exports. It contains API contracts, not database models. Feature APIs use one HTTP client;
TanStack Query owns server data and refreshes it after mutations. React Router
connects the project pages. Zod validates API inputs on the backend and untrusted
JSON responses at the browser boundary. Form checks give immediate feedback.

Build outputs are `packages/shared/dist` (JavaScript and type declarations), `apps/api/dist`
(Node-compatible ESM JavaScript, excluding tests), and `apps/web/dist` (static
assets). API source uses `.js` import extensions so compiled output works in
Node; `tsx` resolves those imports during development.

The root build explicitly sets `NODE_ENV=production` for its child workspace
builds, so a development/test shell cannot cause a development React bundle.
In production and isolated tests, the compiled Express server serves the built
frontend on the same origin as `/api/v1`. Direct frontend links use the SPA
fallback; unknown API routes and missing assets remain JSON 404s. The development
watchers still use Vite plus the API. The non-root Docker runtime packages the
built app and production API dependencies, with environment configuration and
graceful shutdown. See [DOCKER.md](docs/DOCKER.md) for build/run/migration details.

## Tool choices

- React, Vite, Express, TypeScript, Zod, and Pino follow the specification.
- Prisma 7.10.0 and its PostgreSQL adapter provide typed database access. The
  versions are pinned together. Generated code is excluded from lint/format,
  while maintained code and seed/tool scripts are strictly typechecked.
- Argon2 is an API runtime dependency for Argon2id password hashing/verification
  and remains available to the development seed. The `cookie` library parses
  cookies; Express writes HttpOnly/SameSite cookies, Secure in production.
- Sessions use 256-bit opaque random tokens. PostgreSQL stores SHA-256 token
  hashes with a seven-day absolute expiration; logout revokes the current token.
  No token is returned in JSON or stored in localStorage. See the Phase 5/6 report
  for session lifecycle, origin checks, and the in-memory auth rate-limit scope.
- Prisma CLI dependencies `deepmerge-ts` and `mysql2` have scoped overrides to
  patched versions. The former's Map behavior change does not affect our plain
  configuration objects; the latter is not used for our PostgreSQL connections.
  Remove these overrides when Prisma updates its dependencies. See the
  [deepmerge-ts security fix](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0)
  and [MySQL2 advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3).
- ESLint uses type-aware recommended rules and React hooks/refresh checks;
  Prettier owns formatting. TypeScript 5.9 is pinned to a compatible minor line
  supported by the selected lint tooling.
- Node's built-in watch mode restarts the API and `tsx` loads its TypeScript.
  The previous `tsx watch` command stalled before listening on this Windows
  environment; the documented `npm run dev` now starts both services.
  `concurrently`
  provides a portable root command for running both development servers.
  Its `shell-quote` dependency is overridden to 1.11.0, which fixes the
  [reported command-injection vulnerability](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).
  Remove the override when `concurrently` declares a patched dependency itself.
- Vitest runs tests; Supertest verifies HTTP behavior against Express and a real
  isolated PostgreSQL database. React Testing Library and user-event exercise
  project workflows in jsdom, including cache refresh, validation, loading,
  errors, and deletion confirmation. Two Chromium workflows now exercise the
  compiled app with real API/database behavior, also repeated against Docker.
- React Router and TanStack Query implement the routing and server-state choices
  already specified for V1. No second API client or state system is introduced.

The setup follows the official [Vite configuration documentation](https://vite.dev/config/),
[typescript-eslint typed linting guidance](https://typescript-eslint.io/getting-started/typed-linting/),
and [Express error-handling guidance](https://expressjs.com/en/guide/error-handling/).

GitHub workflow and Harness PR validation are verified. Cloud release definitions
are prepared but publishing/deployment are not yet verified. Project
deletion uses the existing database cascade and permanently removes its tasks;
the UI requires explicit confirmation. Archiving is not implemented.
