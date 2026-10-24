# Phase 5 — Authentication and Phase 6 — Tasks

Completed against PROJECT_SPEC.md sections 8, 19–38, 42, 51–61, 90–93, and 134.
Date: 24 October 2026. Phase 7 (Dashboard) has not been started.

## What changed

Authentication now supplies the owner for every project/task operation. Register,
login, logout, and me endpoints are backed by Argon2id password verification and
PostgreSQL sessions. Login and registration forms display validation, server
errors, and pending states. Protected routes redirect to login. Switching account
or logging out cancels old queries and clears protected queries/mutations, so
another account cannot inherit the previous account's cached project data.

Tasks now have five REST endpoints, a project board, create/edit forms, explicit
status selectors, priority, optional due dates, server-side search/filtering,
loading/error/empty states, and explicit deletion confirmation. Task writes update
project progress through cache invalidation and update the parent's activity date
in the same database transaction. The existing Task model is reused.

The existing client, query cache, error response format, Prisma client, and
route → validation → controller → service → repository boundaries are preserved.
Shared auth/task schemas now run in both browser and API; the shared workspace
therefore emits JavaScript in addition to declarations. Normal install/dev/test
commands build it before consumers run. Rebuild shared after changing its schemas
while the app is already running.

## Authentication decisions

- Passwords use Argon2id (64 MiB, three iterations, one lane). Registration accepts
  12–128 characters; passwords are never trimmed. Email is normalized before
  persistence. Passwords, password hashes, and session tokens stay out of DTOs.
- A session is a cryptographically random 32-byte token, not a custom signed
  payload. Only its SHA-256 hash is stored. A token lookup also checks its absolute
  seven-day expiry. A server signing secret is unnecessary for this opaque-token
  design; possession of the random token plus the database record establishes
  validity. This uses Node's standard cryptographic primitives and the existing
  password-hashing library.
- The host-only cookie uses HttpOnly, SameSite=Lax, Path=/, and Secure in
  production. JavaScript does not read it and no localStorage token exists.
  Production configuration requires an HTTPS APP_ORIGIN.
- Login/registration create a fresh token and revoke any current cookie's session.
  Logout revokes the current session and expires the cookie. Expired tokens fail
  on every protected request. Login deletes expired sessions for that user;
  there is no background cleanup scheduler in these phases.
- Browser mutation requests check Origin against APP_ORIGIN and reject cross-site
  Fetch Metadata. POST/PATCH require JSON, and the API grants no cross-origin
  CORS permission. CLI clients may omit Origin while still using JSON.
- Login/register share an IP limiter, default 20 requests per 15 minutes. Its
  in-memory store is per process and resets on restart. It is deliberately modest;
  deployment must review trusted-proxy configuration and multi-instance limits.
- Unknown Prisma errors log only their name/code, because Prisma messages can
  include query arguments containing hashes. Generic API errors do not leak them.
- The temporary development-user middleware, tests, config, and local variable
  were removed. Existing seed data remains owned by its original demo user; its
  discarded random password does not become a public login or transfer ownership.

The session approach follows the
[OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
Password hashing uses [node-argon2](https://github.com/ranisalt/node-argon2), and
the limiter uses [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit).

## Task decisions

- Shared schemas define title/description lengths, statuses, priorities, filter
  values, and date formats. Prisma's existing enums enforce the database values.
  No task owner field is added; ownership is inherited through the project.
- Repository queries include project ownership on list/read/update/delete.
  Foreign and missing records return 404. Task creation checks and locks its
  owned parent before inserting. All task writes lock the parent before the task
  so activity updates and project deletion have consistent lock ordering.
- Search is a parameterized, case-insensitive match on title OR description;
  status, priority, and search combine with AND. SQL wildcard characters are
  escaped so a percent sign searches for a literal percent sign. No full task
  dataset is downloaded to implement the filters in the browser.
- The date picker represents a calendar day at midnight UTC. Due dates render in
  UTC, preserving the selected day. The API also accepts timezone-qualified ISO
  timestamps and normalizes them to UTC. Omitted PATCH fields are preserved;
  null clears description or dueDate.
- The board groups the server's filtered result into TODO, IN_PROGRESS, DONE.
  Status selectors are keyboard-accessible. There is no drag-and-drop.

## Trace one request

Login: `AuthPage.tsx` → `useAuth.ts` → `auth.api.ts` → the existing HTTP client →
`auth.routes.ts` → shared validation → `auth.controller.ts` → `auth.service.ts`
(Argon2 verification/new random token) → `auth.repository.ts` (session row) →
HttpOnly cookie and public user DTO → current-user cache and project navigation.

Create task: `TaskForm.tsx` → `useTasks.ts` mutation → `tasks.api.ts` → HTTP client
→ authenticated project router → shared validation → `task.controller.ts` →
`task.service.ts` → `task.repository.ts` transaction → PostgreSQL → task DTO →
invalidate task/project queries → refreshed board and progress.

## Tests and checks

Final automated results: **72 tests passed** (18 API unit, 16 frontend/client,
38 API/database integrations). Lint, strict TypeScript, formatting, Prisma
validation, and the production build pass. Build output retains the existing
non-failing warning about a JavaScript chunk over 500 KB; no warning threshold
was changed to hide it.

- API unit checks cover configuration and production cookie attributes.
- Auth integration checks exercise real registration/login/me/logout, password
  hashing, public DTOs, token hashing, revocation/replay, rotation, expiration,
  duplicate emails, wrong credentials, origin/content-type checks, and rate limits.
- Existing project integrations now use real authenticated agents rather than a
  development identity. Two-user tests prove foreign reads/updates/deletes fail.
- Task integrations cover real persisted CRUD, defaults, UTC dates, null clearing,
  progress, project activity, combined filters, description search, literal SQL
  wildcards, invalid input, and unauthenticated/foreign access.
- Frontend tests cover registration validation/confirmation, failed login,
  protected routes, logout/account cache isolation, session expiry, task creation,
  status changes, editing, due-date clearing, deletion confirmation/cancel,
  server filtering, errors/retry, and project progress refresh. Existing project
  and HTTP-client tests remain in the suite.
- Full Playwright dashboard workflows remain for the later full-app testing
  phase; no dashboard assertion is claimed before Phase 7 exists.

After the user approved a specific temporary local account, the running browser
verified registration, authenticated project/task creation, status change to DONE,
HIGH priority, UTC due-date editing, combined status/priority/text filters,
project progress refreshing to 100%, logout, and login to the persisted project.
The app was signed out afterward. Guarded cleanup removed only the approved
temporary account, project, tasks, and its sessions; existing records were
preserved. The test database was then stopped. The initial automatic approval
block on live registration was resolved by that explicit user approval.

| Command                                                                | Result                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| npm install for API Argon2, cookie, express-rate-limit, and shared Zod | Installed; npm reported zero vulnerabilities                           |
| npm run db:generate                                                    | Prisma Client generated                                                |
| npm run db:format; npm run db:validate                                 | Schema formatted and valid                                             |
| npm run db:up; npx prisma migrate deploy                               | Development DB ready; session migration applied without resetting data |
| npx prettier --write on affected files; npm run format:check           | Passed                                                                 |
| npm run lint                                                           | Passed with zero warnings                                              |
| npm run typecheck                                                      | Root and all workspaces passed                                         |
| npm test                                                               | 18 API unit and 16 frontend/client tests passed                        |
| npm run test:integration                                               | 38 tests passed against the isolated PostgreSQL database               |
| npm run build                                                          | Passed; bundle-size notice documented above                            |
| git diff --check                                                       | Passed                                                                 |
| npm run dev                                                            | API and Vite started; approved authenticated browser workflow passed   |

Errors fixed during implementation: shared Zod types needed the URL global;
the email schema's length check had to run before piping into email validation;
Argon2 options needed a precise library type; the typed cookie parser replaced
an untyped version; Prisma updates now omit undefined fields explicitly; old
project tests now authenticate through the actual API; origin validation handles
malformed URLs without throwing outside Zod; browser security middleware preserves
the health endpoint's existing 404 behavior; session-expiry cleanup keeps the
current-user query observable while dropping protected data. No type errors were
suppressed and no unsafe casts were introduced.

## Files created

```text
packages/shared/src/auth.ts
packages/shared/src/task.ts
prisma/migrations/20261023000000_authenticated_sessions/migration.sql
apps/api/src/middleware/browser-security.ts
apps/api/src/middleware/require-auth.ts
apps/api/src/modules/auth/auth.controller.ts
apps/api/src/modules/auth/auth.cookie.ts
apps/api/src/modules/auth/auth.cookie.test.ts
apps/api/src/modules/auth/auth.integration.test.ts
apps/api/src/modules/auth/auth.rate-limit.ts
apps/api/src/modules/auth/auth.repository.ts
apps/api/src/modules/auth/auth.routes.ts
apps/api/src/modules/auth/auth.service.ts
apps/api/src/modules/tasks/task.controller.ts
apps/api/src/modules/tasks/task.integration.test.ts
apps/api/src/modules/tasks/task.repository.ts
apps/api/src/modules/tasks/task.routes.ts
apps/api/src/modules/tasks/task.service.ts
apps/api/test/auth.ts
apps/web/src/features/auth/api/auth.api.ts
apps/web/src/features/auth/hooks/useAuth.ts
apps/web/src/features/auth/auth.test.tsx
apps/web/src/features/tasks/api/tasks.api.ts
apps/web/src/features/tasks/hooks/useTasks.ts
apps/web/src/features/tasks/components/TaskBoard.tsx
apps/web/src/features/tasks/components/TaskForm.tsx
apps/web/src/features/tasks/tasks.test.tsx
apps/web/src/pages/AuthPage/AuthPage.tsx
docs/PHASE_05_06.md
```

## Existing files modified or removed

```text
.env.example
package.json
package-lock.json
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/src/index.ts
prisma/schema.prisma
apps/api/package.json
apps/api/test/environment.ts
apps/api/src/app.ts
apps/api/src/config/env.ts
apps/api/src/config/env.test.ts
apps/api/src/middleware/error-handler.ts
apps/api/src/middleware/error-handler.integration.test.ts
apps/api/src/modules/projects/project.routes.ts
apps/api/src/modules/projects/project.service.ts
apps/api/src/modules/projects/project.repository.ts
apps/api/src/modules/projects/project.integration.test.ts
apps/web/package.json
apps/web/src/app/App.tsx
apps/web/src/app/App.test.tsx
apps/web/src/lib/api/client.ts
apps/web/src/pages/ProjectDetailPage/ProjectDetailPage.tsx
apps/web/src/styles/global.css
README.md
docs/API.md
docs/DATABASE.md
docs/PROJECT_PROGRESS.md
```

Removed `apps/api/src/middleware/development-user.ts` and its integration test.
The ignored local `.env` lost DEV_USER_ID and gained APP_ORIGIN; database
credentials were preserved. Generated Prisma code/build outputs remain ignored.
No commit was created and existing uncommitted work was preserved.

## Learning checks

1. How does a random cookie value become a user ID without storing the raw token?
2. Why do passwords use Argon2id while random session tokens use SHA-256?
3. Why does logout need to delete a database row as well as clear a cookie?
4. What does HttpOnly prevent, and why are Origin/SameSite checks also present?
5. Where is User B prevented from updating User A's task?
6. Which transaction updates the task and its parent's activity date together?
7. What is the difference between omitted dueDate and dueDate set to null?
8. Why must switching account clear project/task caches?
9. How do the two test databases and per-test owners avoid deleting your work?
10. Why is the shared package now built into JavaScript before API startup?

Suggested commit: `feat: add authenticated sessions and task management`
