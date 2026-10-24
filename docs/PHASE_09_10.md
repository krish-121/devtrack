# Phases 9 and 10 — testing hardening and Docker

Completed on 24 October 2026 against PROJECT_SPEC.md sections 56–66,
117–124, and Phase 9/10 in section 134. Phases 1–8 already supplied the product,
87 automated tests and PostgreSQL-only Compose. This slice adds focused service
tests, coverage gates, two real browser workflows and production packaging.
Phases 1–10 are implemented. Phase 11 remains next; no GitHub/Harness/cloud work
was started and no commit was created.

## Implementation and important decisions

- Existing business services, repositories, shared schemas, HTTP client and
  TanStack Query architecture remain unchanged. Unit tests isolate only the
  repository boundary; API tests still use real PostgreSQL. Password tests use
  real Argon2. Browser tests do not mock HTTP or the database.
- Added 21 service/progress tests across authentication, projects, tasks and
  dashboard. They check missing/foreign record errors, ownership arguments,
  filtered reads, dates/null handling, PATCH omissions, rounded/empty progress,
  zero-filled summary statuses, password verification and opaque token storage.
- Added four static-serving integration tests for direct SPA navigation, cache
  headers, security headers, API JSON 404s, missing files and health. Added a
  frontend regression test for duplicate task creation prevention and retained,
  focused form input after a server validation failure.
- Added exactly the two browser workflows required by the spec. Both run against
  the compiled server and again against Docker. Their accounts/database are
  separate from development and API integration fixtures, with guarded cleanup.
- Coverage includes maintained API/UI code. Process entry points and generated
  Prisma code are explicitly excluded from unit coverage; real compiled-server
  and container tests check those entry points. Coverage gates enforce 75% for
  both workspaces and 85% for API service files (all four metrics). There is no
  artificial test volume or threshold reduction to make the checks pass.
- Extracted the existing subprocess execution into one small shared script helper
  for integration, build and E2E commands. Root tooling type checking includes
  browser test files and DOM types; strict backend TypeScript settings remain.
- `createApp(webDirectory?)` keeps Supertest's API-only entry while allowing the
  compiled server to serve built frontend assets in production/isolated tests.
  Existing route/validation/controller/service/repository boundaries are preserved.
  Unknown APIs stay JSON 404s; missing assets/non-HTML requests/dotfiles do not
  receive the SPA fallback. Index HTML is not cached; fingerprinted assets are.
- The direct Node process handles SIGTERM/SIGINT, drains HTTP and disconnects
  Prisma, with a bounded shutdown deadline. Existing stdout/stderr Pino logging,
  environment validation, auth origin checks and Secure cookie policy remain.
- The Dockerfile builds from pinned Node 24.18.0/npm 11.16.0 with `npm ci`,
  explicitly generates Prisma, builds the application and copies only required
  production packages/output into a non-root runtime. A separate dependency
  stage selects API/shared workspaces and omits optional CLI/peer dependencies.
  No local env files/secrets, source tree, Prisma CLI, TypeScript, Playwright or
  runtime React packages are present in the final image.
- Root builds explicitly set production mode, preserving workspace order and
  preventing a developer/test shell's NODE_ENV from changing the frontend
  artifact. The resulting JS bundle is about 417 kB, with no chunk-size warning.
- No data model, migration, auth scheme, API client, state system or product
  feature changed. Migrations remain explicit operations; startup never migrates
  or seeds. The existing build stage can serve as an explicit migration tools
  image. Registry publishing, TLS infrastructure and deployment remain later work.

## Tests, commands and results

| Check                                                               | Result                                                                             |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm install --save-dev @playwright/test @vitest/coverage-v8@5.0.3` | Installed locked dependencies; npm audit reported zero vulnerabilities             |
| `npx playwright install chromium`                                   | Official Chromium binary installed for automated tests                             |
| Prettier on affected files; `npm run format:check`                  | Passed                                                                             |
| `npm run db:validate`                                               | Passed; existing schema/migrations unchanged                                       |
| `npm run lint`                                                      | Passed with zero warnings                                                          |
| `npm run typecheck`                                                 | Passed, including browser/config/tooling and all workspaces                        |
| `npm test`                                                          | 39 API unit/service/configuration and 28 frontend/client tests passed              |
| `npm run test:integration`                                          | 46 real API/database/static integration tests passed                               |
| `npm run test:coverage`                                             | All 113 unit/frontend/integration tests passed; coverage gates passed              |
| `npm run test:e2e`                                                  | Both compiled-server Chromium workflows passed                                     |
| `npm run build`                                                     | Production shared/API/web output built successfully                                |
| `docker build --tag devtrack:local .`                               | Production image built with locked dependencies                                    |
| `npm run test:docker`                                               | Both Chromium workflows passed against Docker; production-mode smoke checks passed |
| `git diff --check`                                                  | Passed                                                                             |
| `npm run db:test:stop`                                              | Integration test service stopped after verification                                |

**115 unique tests passed**: 39 API unit/service/configuration + 46 integration +
28 frontend/client + 2 browser workflows. The two browser tests were also repeated
against Docker; these are repeated checks, not additional unique test cases.

| Maintained-code coverage | API    | Frontend |
| ------------------------ | ------ | -------- |
| Lines                    | 98.56% | 94.01%   |
| Statements               | 97.61% | 92.45%   |
| Branches                 | 92.51% | 88.65%   |
| Functions                | 100%   | 92.46%   |

All four API services have 100% measured lines/functions; their branch coverage
is at least 87.5%, above the 85% target. This does not claim that tests establish
every possible runtime behavior. See [TESTING.md](TESTING.md) for measured scope,
exclusions, report paths, environment guards and reset strategy.

The Docker check runs real registration/project/task/dashboard and returning-user
search/edit/logout workflows against a loopback-bound container with its own
PostgreSQL service. It then restarts the same image in default production mode
on configured PORT=8080, verifies Docker health, HTML fallback, JSON API errors,
protected access, DB-backed registration/session lookup, Secure/HttpOnly cookies,
UID 1000 and absence of build-only packages/local env/source. Both containers
exit with code zero after Docker sends SIGTERM. Production API smoke requests
use the configured HTTPS Origin over the internal HTTP transport; TLS termination
itself belongs to deployment. No production database was contacted.

E2E and application test containers were stopped/removed by the runner, and its
database stopped to discard tmpfs data. Development watchers/database and user
data were preserved. The reusable local `devtrack:local` image/build cache,
stopped test database services/network, and ignored test reports remain.
The user’s development browser was not used
for these automated workflows.

## Resolved failures and self-review

- Initial new service assertions used `status` instead of the existing
  `AppError.statusCode`; the tests were corrected to the established contract.
- Playwright's types required DOM declarations in the root tooling tsconfig;
  these were added without weakening strict checks or backend library settings.
- Image inspection caught Prisma's optional CLI peers, TypeScript and Prisma
  Studio's React dependency tree in the initial production install. The final
  stage uses only API/shared workspaces and omits optional/peer-only packages.
  Runtime-content assertions and both real workflows pass with the trimmed image.
- Comparing artifacts exposed test/development NODE_ENV influencing Vite. The
  cross-platform root build wrapper now sets production mode explicitly, resolving
  the earlier approximately 652 kB development bundle/chunk warning without
  raising the warning threshold or adding a bundling abstraction.
- Docker's deprecated stop flag was replaced with `--timeout`. An explicit
  Prettier invocation initially listed ignore files without a supported parser;
  supported source/config/docs formatting and the repository check passed.
- Final review checked spec scope, owner/session isolation, same-origin API/static
  boundaries, secret exclusion, runtime dependency contents, cleanup and retained
  uncommitted work. No unresolved functional/check failure remains. npm's
  dependency install-script notices and terminal color warnings are non-failing;
  native dependencies and actual application startup/workflows were verified.

## Files created

```text
.dockerignore
Dockerfile
playwright.config.ts
e2e/environment.ts
e2e/workflows.spec.ts
scripts/build.ts
scripts/run-command.ts
scripts/test-e2e.ts
apps/api/src/static.integration.test.ts
apps/api/src/modules/auth/auth.service.test.ts
apps/api/src/modules/projects/project.service.test.ts
apps/api/src/modules/tasks/task.service.test.ts
apps/api/src/modules/dashboard/dashboard.service.test.ts
docs/TESTING.md
docs/DOCKER.md
docs/PHASE_09_10.md
```

## Existing files modified

```text
.gitignore
.prettierignore
package.json
package-lock.json
tsconfig.json
eslint.config.js
docker-compose.yml
scripts/test-integration.ts
apps/api/src/app.ts
apps/api/src/server.ts
apps/api/vitest.config.ts
apps/web/package.json
apps/web/vitest.config.ts
apps/web/src/features/tasks/tasks.test.tsx
README.md
docs/API.md
docs/DATABASE.md
docs/PROJECT_PROGRESS.md
```

These lists describe this slice; most earlier implementation files were already
untracked. The specification and AGENTS instructions were not edited, and no
pre-existing changes were discarded.

## Concepts to understand

1. What different failure does a service test, real database integration test,
   frontend test and browser workflow detect? Why should repository mocks never
   substitute for ownership/transaction tests against PostgreSQL?
2. Why does browser automation need its own account, database and port? How do
   fixed configuration, unique fixtures and `finally` cleanup work together?
3. What does coverage measure, and why is it useful to include untested files
   while testing process entry points through actual runtime checks?
4. Explain each Docker stage. Why do build tools, source and Prisma CLI belong
   outside the final runtime, and how did optional peers complicate that?
5. Why must `/api` be resolved before SPA fallback? Why must index.html and hashed
   assets have different caching rules?
6. What does localhost mean inside a container? How does PORT differ from the
   host's published port, and where will production TLS terminate?
7. Why are migration deployment and production seeding separate decisions from
   starting the server? Which operation did this task actually perform?
8. Why should Node receive SIGTERM directly, and what happens to HTTP/database
   connections before the process exits?
9. Why must production builds control NODE_ENV independently of the test runner?

Suggested Git commit message after reviewing/staging the intended working tree:

`test: harden workflows and add production Docker packaging`
