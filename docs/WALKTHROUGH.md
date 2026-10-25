# Walk through the working code

Run the app using [README.md](../README.md), then follow one request at a time.
Paths below are relative to the repository root. Read the named functions rather
than memorizing a framework diagram. [API.md](API.md) owns exact HTTP contracts.

## Create a task

1. Open a project in `apps/web/src/pages/ProjectDetailPage/ProjectDetailPage.tsx`.
   Its task UI is `features/tasks/components/TaskBoard.tsx`.
2. `TaskForm.tsx` keeps unsaved values in React state. `submit` converts a date-only
   choice to a UTC timestamp, runs `createTaskSchema.safeParse`, displays field
   errors and calls `onSubmit` only for acceptable input.
3. `useTaskMutations(projectId)` in `features/tasks/hooks/useTasks.ts` calls
   `tasksApi.create(projectId, input)`. It does not contain another HTTP client.
4. `features/tasks/api/tasks.api.ts` chooses
   `POST /projects/:projectId/tasks`. `lib/api/client.ts` adds the `/api/v1` boundary,
   encodes the request and validates the response using `taskResponseSchema`.
5. `apps/api/src/app.ts` mounts `projectRouter` at `/api/v1/projects` after browser
   security middleware. `project.routes.ts` authenticates, parses `projectId`,
   then mounts `projectTaskRouter` under `/:projectId/tasks`.
6. `task.routes.ts` runs `validateBody(createTaskSchema)` before
   `task.controller.ts#createTask`. Validated values and authenticated owner are
   in `response.locals`, not taken from a client-supplied owner field.
7. `task.service.ts#createTask` calls `task.repository.ts#createTask`. The repository
   transaction updates the owned parent, then creates the task. A missing or
   inaccessible parent returns null; the service turns that into `PROJECT_NOT_FOUND`.
8. The service converts stored dates to ISO strings. The controller returns 201,
   a task Location header and `{ data: task }`.
9. The successful mutation invalidates tasks for this project, projects and
   dashboard. Refetching updates the task board, progress and summary cards.

Trace an error too: send a blank title, then an inaccessible project UUID. The
first fails validation; the second fails authorization through the owner-scoped
query. These are different checks. Read `task.integration.test.ts` for both.

## Login and authenticated access

1. `pages/AuthPage/AuthPage.tsx` collects credentials and calls
   `features/auth/hooks/useAuth.ts#useSignIn`.
2. `features/auth/api/auth.api.ts` calls the shared client. The auth router validates
   input and applies `auth.rate-limit.ts`; browser-security middleware checks origin.
3. `auth.controller.ts` calls `auth.service.ts#login`.
4. `auth.repository.ts#findUserByEmail` looks up the normalized address.
   `login` verifies Argon2id; absent users still incur dummy-hash verification.
5. `newSession` creates a random token. `createSession` stores its SHA-256 hash,
   user ID and expiry. `auth.cookie.ts#setSessionCookie` returns the raw token only
   in the HttpOnly cookie. The JSON contains the public user, never a hash/token.
6. `useAuth.ts#replaceSession` cancels queries, removes old account data and sets
   `['auth', 'me']`. The app can now enter protected pages.
7. On the next protected API request, `require-auth.ts#requireAuth` reads the cookie
   and calls `authenticate`. A matching unexpired session supplies `ownerId`.
8. Logout deletes the session and clears the cookie and browser caches. Seven-day
   expiry is enforced by database lookup even if a client retains a cookie.

See `auth.integration.test.ts` and `auth.cookie.test.ts` for the security boundary.
Do not log a cookie or paste it into screenshots while investigating.

## Create a project

`ProjectFormPage.tsx` composes `ProjectForm.tsx` → `useCreateProject` →
`projectsApi.create` → shared HTTP client → `projectRouter` authentication and
`createProjectSchema` → `project.controller.ts#createProject` →
`project.service.ts#createProject` → `project.repository.ts#createProject` → Prisma.

The owner comes from the session. `project.mapper.ts#toProjectDtos` adds derived
task counts/progress and converts dates. Creation returns 201. `useCreateProject`
invalidates project and dashboard queries. Update uses PATCH semantics: an omitted
description retains it, null clears it. Deletion returns 204 and cascades tasks.

## Dashboard

`DashboardPage.tsx` → `features/dashboard/hooks/useDashboard.ts` →
`dashboard.api.ts` → `dashboard.routes.ts` → `dashboard.controller.ts` →
`dashboard.service.ts#getDashboardSummary` →
`dashboard.repository.ts#getDashboardData`.

The repository uses a repeatable-read transaction for four bounded queries:
owned project count, task counts grouped by status, five recent projects, and
task counts for those projects. The service computes open tasks as TODO plus
IN_PROGRESS and initializes missing status groups to zero. `toProjectDtos` builds
recent progress. The client renders actual totals, including useful empty states.
Project/task mutations invalidate `['dashboard']`; no second counter is maintained.

## PR validation

1. A `codex/...` branch is pushed and a PR targets protected `main`.
2. `infrastructure/harness/triggers/devtrack-pr-validation.yaml` describes the
   installed GitHub webhook. Its clone overlay selects the pull-request number.
3. `pipelines/devtrack-pr-validation.yaml` runs on a disposable Linux Harness Cloud
   machine. `scripts/setup-node.sh` installs the pinned official Node/npm versions.
4. Native Run steps install dependencies, check format/schema/lint/types, run
   unit/frontend tests, real isolated PostgreSQL integrations, coverage and build.
5. Harness reports `devtrack_pr_validation-Validate` on GitHub. The current PR head
   must be green and up to date before a normal merge. No force push to main or
   administrator bypass is part of the workflow.
6. [PHASE_11_12.md](PHASE_11_12.md) records a deliberate failure and corrected run;
   this proves the gate works rather than merely showing a saved definition.

## Release pipeline

Read `infrastructure/harness/pipelines/devtrack-release.yaml` beside this trace.

1. An exact full main SHA is supplied as clone ref and `release_commit`.
   `verify-release-source.sh` rejects dirty, stale, non-main or mismatched sources.
2. **Validate** reruns the release quality gates before any publishing.
3. **Package** rechecks main, forwards the SHA as `APP_VERSION`, and uses the native
   GAR template twice: Docker `runtime` and `migrations` targets. Immutable full-SHA
   tags identify both images. The Dockerfile rejects a missing version.
4. The Harness service selects the same commit's Cloud Run manifest and exact
   application image. The infrastructure selects only the approved project/region.
   CI uses `gcp`; native CD uses the approved limited `gcp_cd` fallback.
5. **Deploy Production** rechecks source, installs smoke tools, and renders
   `infrastructure/cloud-run/migrate.yaml` to an ignored job manifest. Substitution
   includes only references/configuration, not the secret's plaintext value.
6. The native Cloud Run job step applies reviewed migrations once with no retry
   loop and no production seed. Failure stops deployment.
7. The native Cloud Run deploy step uses the resolved published application image,
   runtime service account, pinned database secret version and Cloud SQL socket.
8. `scripts/smoke-deployment.ts` checks external HTTPS health, baked full SHA and
   frontend HTML. Health alone would not prove correct release or DB connectivity.

The latest live result and limitations belong in [PHASE_13_14.md](PHASE_13_14.md),
not in this conceptual trace. A valid YAML file is not evidence of a successful
cloud run. See [DEPLOYMENT.md](DEPLOYMENT.md) for run/recovery/trial instructions.
