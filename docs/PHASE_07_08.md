# Phases 7 and 8 — dashboard and application polish

Completed on 24 October 2026 against PROJECT_SPEC.md sections 8–11, 54,
95–97, and the Phase 7/8 scope in section 134. Phases 1–6 already supplied
authentication, owner-scoped project/task CRUD, forms, filtering, shared feedback,
and meaningful tests. This slice completes the dashboard and improves those
existing screens. Phases 1–8 are implemented; Phase 9 is next.

## Result and implementation decisions

After registration/login, `/dashboard` shows active projects, open tasks,
completed tasks, all three task status counts, and up to five recent projects
with actual progress. All values come from PostgreSQL for the authenticated
owner. An empty account gets clear zero counts and a first-project action.

The request follows the existing boundaries:

```text
DashboardPage → useDashboard → dashboard.api → existing apiClient
  → dashboard.routes → requireAuth → controller → service → repository
  → existing Prisma client → PostgreSQL
```

- The summary endpoint has no input fields to validate; its owner comes from
  the existing cookie session. Browser security middleware and `no-store`
  responses also apply to it. Every repository query scopes data to this owner.
- “Active projects” counts all existing owned projects because the established
  V1 model uses hard deletion and has no archive/status field. Open tasks are
  TODO + IN_PROGRESS; completed tasks are DONE.
- One summary use case runs four bounded database queries: project count,
  grouped task status counts, five recent projects, and grouped progress for
  those projects. Repeatable Read gives these queries a consistent snapshot.
  There is no full task load or extra query per recent project.
- Recent ordering is updatedAt descending, then ID ascending. Existing task
  mutations already update project activity. Totals include every owned project,
  even when it is outside the recent five.
- The existing project response schemas moved to the shared package. Their
  DTO types are derived from those schemas. A small pure project mapper now
  serves both project endpoints and the dashboard, preserving one progress
  formula and public project shape.
- TanStack Query remains the only server-state system. Every successful project
  or task mutation invalidates the dashboard, alongside existing project/task
  queries. Existing session replacement clears private query data on logout or
  account changes, including dashboard data.
- No dependencies, database models, migrations, auth mechanisms, or deployment
  settings changed. No drag-and-drop, fake analytics, archiving, infrastructure,
  Phase 9 E2E setup, or additional features were added.

The transaction choice follows the official
[Prisma transaction documentation](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions).
Cache refresh follows the existing
[TanStack Query invalidation pattern](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).

## Feedback, responsive behavior, and accessibility

- Session, project, task, and dashboard loading use one clean status component.
  Mutation buttons identify the real action in progress and disable duplicate
  submission. Status changes and task deletion also expose pending feedback.
- Major empty lists offer a useful action. Filtered task results can show all
  tasks; a project without tasks can open its first task form.
- Failed requests have contextual errors and retry. Missing or inaccessible
  projects offer a route back to projects. Existing safe API error translation
  remains the boundary for server messages.
- Forms focus their first invalid input or general server error, retain labels
  and descriptions, and expose busy state. Route changes focus the main content
  while preserving a form's initial input focus. Query-string changes do not
  steal search focus.
- Inline delete confirmations focus “Keep project/task”; cancelling returns to
  the trigger. Closing a task form returns focus to “New task” after saving or
  cancelling, including when the original empty-state button disappears.
- Task labels read “To do”, “In progress”, and “Done”. Search remains in sync with
  browser back/forward navigation. Status counts and progress have visible text,
  so meaning does not depend on bar color alone.
- The dashboard, forms, and board stack at narrow widths. Mobile keeps Dashboard,
  Projects, and logout accessible; long account text and buttons wrap. Existing
  semantic controls, skip link, visible interactive focus, and labeled progress
  are preserved.

## Tests and verification

New API integration coverage verifies authentication, empty data, `no-store`,
cross-account isolation (including an attempted owner selector), grouped counts,
shared progress, recent ordering/limit, totals beyond five projects, task status
changes, project activity, and deletion cascades against real PostgreSQL.

New frontend coverage verifies loading/populated/empty/error/retry dashboard
states; refreshing after task and project mutations; missing-project recovery;
invalid-field focus; safe confirmation focus/cancellation; task-form focus after
cancel/save; back/forward search synchronization; and pending task deletion.
Existing auth tests now model the post-login dashboard response. Existing project,
task, HTTP-client, auth, database, seed, and configuration coverage is retained.

| Command                                      | Result                                                      |
| -------------------------------------------- | ----------------------------------------------------------- |
| `npx prettier --write` on affected files     | Formatted                                                   |
| `npm run format:check`                       | Passed                                                      |
| `npm run db:validate`                        | Passed; no schema changes                                   |
| `npm run lint`                               | Passed with zero warnings                                   |
| `npm run typecheck`                          | Passed across all workspaces                                |
| `npm test`                                   | 18 API unit/configuration + 27 frontend/client tests passed |
| `npm run test:integration`                   | 42 tests across 8 files passed on isolated PostgreSQL       |
| `npm run build`                              | Shared package, API, and web build passed                   |
| `git diff --check`                           | Passed                                                      |
| `npm run build --workspace @devtrack/shared` | Refreshed runtime schemas during development                |
| `npm run db:test:stop`                       | Stopped disposable test DB after verification               |

Total: **87 passing automated tests**. These are targeted frontend/integration
checks; full Playwright workflows and broader testing hardening remain Phase 9.

The final pending-button guard was rechecked with
`npm test --workspace @devtrack/web` (27 passing tests),
`npm run build --workspace @devtrack/web` (including web type checking), and
targeted Prettier/ESLint checks for TaskBoard.tsx.

Live browser verification used the explicitly approved disposable local account.
It confirmed empty onboarding, project/task creation, task completion, refreshed
dashboard totals and 100% progress, mobile navigation/stacking/filter recovery,
safe confirmation cancellation, task-form focus restoration, and logout.
Desktop and 390px mobile dashboard screenshots were captured; the project view
also fit a 320px viewport without horizontal overflow. The temporary viewport
override was reset. No browser console errors were observed in this workflow.
The account, its one project/task, and dependent session data were removed using
exact identity guards; zero test account/project/task records remain. Existing
development data was preserved. The running app is signed out at `/login`.

Resolved check issues: the initial typecheck caught a stale unused import after
moving project schemas; earlier auth test mocks expected the old post-login
projects route; new test queries included an unsupported Testing Library option.
Those were corrected. Live checking also found task-form focus loss on close;
it is fixed and covered by a behavior test. Source review also ensured invalid
fields take focus before a general server error. A sandbox temporary-file error
interrupted the frontend runner; rerunning with normal local process access
passed. No functional/check failure remains.

The production web build still emits the existing non-failing chunk-size warning
(about 652 kB before gzip). The threshold was not raised. Performance splitting
can be considered in a later phase; it does not block this requested scope.
No commit was created and pre-existing uncommitted work was preserved.

## Files created in this slice

Paths are relative to the repository root, rather than Git's untracked status:
most earlier application work is still uncommitted.

```text
packages/shared/src/dashboard.ts
apps/api/src/modules/dashboard/dashboard.routes.ts
apps/api/src/modules/dashboard/dashboard.controller.ts
apps/api/src/modules/dashboard/dashboard.service.ts
apps/api/src/modules/dashboard/dashboard.repository.ts
apps/api/src/modules/dashboard/dashboard.integration.test.ts
apps/api/src/modules/projects/project.mapper.ts
apps/web/src/pages/DashboardPage/DashboardPage.tsx
apps/web/src/features/dashboard/api/dashboard.api.ts
apps/web/src/features/dashboard/hooks/useDashboard.ts
apps/web/src/features/dashboard/dashboard.test.tsx
apps/web/src/features/tasks/task-labels.ts
apps/web/src/components/ui/LoadingState.tsx
apps/web/src/components/ui/useConfirmationFocus.ts
apps/web/src/lib/forms/useFormFocus.ts
apps/web/src/app/polish.test.tsx
docs/PHASE_07_08.md
```

## Existing files modified in this slice

```text
packages/shared/src/project.ts
packages/shared/src/index.ts
apps/api/src/app.ts
apps/api/src/modules/projects/project.repository.ts
apps/api/src/modules/projects/project.service.ts
apps/web/src/app/App.tsx
apps/web/src/components/ui/QueryError.tsx
apps/web/src/features/auth/auth.test.tsx
apps/web/src/features/projects/api/projects.api.ts
apps/web/src/features/projects/hooks/useProjects.ts
apps/web/src/features/projects/components/ProjectForm.tsx
apps/web/src/features/projects/components/DeleteProject.tsx
apps/web/src/features/tasks/hooks/useTasks.ts
apps/web/src/features/tasks/components/TaskForm.tsx
apps/web/src/features/tasks/components/TaskBoard.tsx
apps/web/src/pages/AuthPage/AuthPage.tsx
apps/web/src/pages/ProjectsPage/ProjectsPage.tsx
apps/web/src/pages/ProjectDetailPage/ProjectDetailPage.tsx
apps/web/src/pages/ProjectFormPage/ProjectFormPage.tsx
apps/web/src/styles/global.css
README.md
docs/API.md
docs/PROJECT_PROGRESS.md
```

## Concepts to understand

1. Trace the summary request from React to PostgreSQL. Why does its owner come
   from `requireAuth` rather than a query parameter?
2. Why are open tasks TODO + IN_PROGRESS, and why is every stored project active
   in this V1 model?
3. Why do four small queries in one Repeatable Read transaction still represent
   one summary use case? What inconsistency could separate snapshots introduce?
4. Why are task counts grouped in PostgreSQL rather than loading every task?
5. Where is progress calculated once, and what does an empty project return?
6. Which query keys must a task mutation invalidate, and why does logout clear
   private cached dashboard data?
7. How does form/confirmation focus help someone using only a keyboard? Why
   should an inline destructive confirmation start on the safe choice?
8. What do real database tests establish that mocked frontend tests cannot,
   and what does a live mobile check establish that jsdom cannot?

Suggested commit message after reviewing the combined working tree:

`feat: add authenticated dashboard and application polish`
