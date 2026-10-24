# Testing DevTrack

Run commands from the repository root with Node/npm versions pinned in README,
Docker Desktop's Linux engine running, and dependencies installed with `npm ci`.
Install the Chromium binary once after installing/updating Playwright:

```sh
npx playwright install chromium
```

Linux CI hosts may use `npx playwright install --with-deps chromium` to install
the browser's OS dependencies too. Chromium is a test dependency, not part of
the application image.

## Test layers and commands

| Command                    | Boundary exercised                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                 | API unit/configuration/service tests and frontend/client behavior in jsdom; no database required                             |
| `npm run test:integration` | Express/Supertest with real PostgreSQL, migrations, constraints, ownership, sessions, CRUD, summary, seed and static routing |
| `npm run test:coverage`    | API unit + integration coverage together, then frontend coverage                                                             |
| `npm run test:e2e`         | Two real Chromium workflows against the compiled app and a disposable PostgreSQL service                                     |
| `npm run test:docker`      | The same browser workflows against the built image, then default production-mode smoke checks                                |

Tests exercise behavior instead of internal React state or mocked database
semantics. Service unit tests mock the repository boundary to focus on business
decisions; authentication still performs real Argon2 hashing/verification. Real
integration tests retain responsibility for SQL, transactions, constraints,
ownership and session persistence. Frontend tests control HTTP responses for
loading/failure scenarios. Browser tests use real HTTP, cookies, server and DB.

## Database and process isolation

| Use                        | Database        | Loopback port | Storage                   |
| -------------------------- | --------------- | ------------- | ------------------------- |
| Development                | `devtrack_dev`  | 5432          | Persistent named volume   |
| API integration/coverage   | `devtrack_test` | 5433          | Disposable tmpfs          |
| E2E/container verification | `devtrack_e2e`  | 5434          | Separate disposable tmpfs |

Integration/coverage runners override database configuration with the fixed test
environment, apply migrations and clean their own fixtures. Stop/reset that
service after running, or after an interrupted run:

```sh
npm run db:test:stop
```

Do not run integration and coverage suites concurrently: they share the test
database and the repeatable seed's stable IDs.

The E2E runner uses a separate Compose project `devtrack-e2e`, starts/migrates its
database, and always stops it in `finally`, discarding its tmpfs data. Tests create
unique accounts and delete only their own fixture account/projects. A failed
test still runs fixture cleanup; service shutdown also resets the entire isolated
database. The test module refuses any database URL except the fixed local E2E
URL and requires `NODE_ENV=test`.

The compiled app listens on 4173 for normal E2E; container tests use host port 4174. Playwright refuses to reuse an existing server. Neither command uses the
development app on 5173/3000 or its database. Do not run E2E and Docker suites
simultaneously because they intentionally share one E2E database/port.
If the runner is forcibly killed, recover only its named test resources:

```sh
docker compose --project-name devtrack-e2e --env-file .env.example --profile e2e stop db-e2e
```

Container names include the runner PID (`devtrack-e2e-<pid>`); stop/remove a
leftover test container by its exact name after checking `docker ps -a`.
There is no broad database reset or development-volume deletion command.

## Required browser workflows

1. Register → create project → create task → mark Done → dashboard shows one
   completed task, zero open tasks and 100% progress, including after reload.
2. Prepare an isolated returning user's data through the public API → log in
   through the UI → open project → search for a task → edit it → reload to check
   persistence → log out → protected navigation returns to login.

`playwright.config.ts` runs one Chromium worker, no retries and no `test.only`.
There are no arbitrary sleeps in UI tests: locators and assertions wait for real
states. The runner's bounded health polling only waits for container startup.
The browser suite is deliberately small, as required by the spec.

The local browser/container workflows use test-mode cookies for loopback HTTP.
The container smoke phase then restarts the same image with default production
mode, an HTTPS application origin and a different configured PORT. It verifies
real database-backed registration/session lookup with Secure/HttpOnly cookies,
static/API responses, Docker health, runtime contents, non-root user and graceful
SIGTERM exit. The HTTP client sends the configured HTTPS Origin explicitly for
that API smoke check; this does not test TLS termination itself or turn off the
production HTTPS requirement. TLS/deployment remain later infrastructure work.

## Coverage and artifacts

Reports are generated in `apps/api/coverage/` and `apps/web/coverage/`, with
HTML, text and JSON summaries. The API report combines unit and database suites;
measuring unit tests alone would miss real repositories/controllers. Both
workspaces enforce 75% lines/statements/functions/branches. API service files
also enforce 85% for each of those metrics.

Generated Prisma code and test files are excluded. Process entry points
`server.ts` and `main.tsx` are excluded from unit coverage because their lifecycle
is tested by compiled-server/container browser and smoke checks. Maintained
business logic, repositories, API middleware and React features remain included,
including files without test coverage. Shared schema behavior is exercised at
the API and frontend boundaries; this is not a separate shared-package coverage
percentage.

Playwright produces an ignored HTML report in `playwright-report/` and artifacts
in `test-results/`. Failures retain traces/screenshots. The dashboard workflow
also saves a successful `dashboard-verified.png`. These can contain disposable
test credentials/session state and must stay ignored. Open the latest report:

```sh
npx playwright show-report
```

See [PHASE_09_10.md](PHASE_09_10.md) for measured coverage and verified commands.
The setup follows the official [Playwright web-server guide](https://playwright.dev/docs/test-webserver),
[browser installation guide](https://playwright.dev/docs/browsers), and
[Vitest coverage guide](https://vitest.dev/guide/coverage.html).
