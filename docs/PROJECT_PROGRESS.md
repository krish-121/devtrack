# DevTrack phase progress

Engineering source of truth: [PROJECT_SPEC.md](PROJECT_SPEC.md), section 134.
Status checked on 26 October 2026 against the working tree and prior project
instructions. Phases 1–10 were implemented locally before being imported as
focused bootstrap commits in the Phase 11 pull request.

## Phase status

| Phase                      | Status                   | Evidence                                                                                                                    |
| -------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1 — Repository Foundation  | Implemented and verified | npm workspaces, React/Vite, Express health endpoint, strict TypeScript, ESLint, Prettier, root commands                     |
| 2 — Database Foundation    | Implemented and verified | PostgreSQL Compose services, User/Project/Task schema, migration, seed, database constraints and integration tests          |
| 3 — Backend Project Slice  | Implemented and verified | Five project endpoints, validation, thin controllers, services, owner-scoped repositories, real database tests              |
| 4 — Frontend Project Slice | Implemented and verified | Project list/detail/create/edit/delete UI, one HTTP client, React Router, TanStack Query, frontend behavior tests           |
| 5 — Authentication         | Implemented and verified | Register/login/logout/me, Argon2id, expiring database sessions, protected routes, authenticated ownership tests             |
| 6 — Tasks                  | Implemented and verified | Owner-scoped task CRUD/API/UI, status, priority, due dates, server search/filtering, tests                                  |
| 7 — Dashboard              | Implemented and verified | Authenticated summary endpoint, real owner-scoped counts, recent project progress, mutation refresh, tests                  |
| 8 — Error/Loading/Polish   | Implemented and verified | Shared feedback states, actionable empty states, safe confirmation/form focus, responsive navigation and layout             |
| 9 — Testing Hardening      | Implemented and verified | Service tests, real database/API tests, frontend coverage gates, two isolated Chromium workflows                            |
| 10 — Docker                | Implemented and verified | Multi-stage production image; same-origin SPA/API, non-root runtime, health/shutdown and real container workflow checks     |
| 11 — GitHub Workflow       | Implemented and verified | Focused commits, normal merged PRs, PR template, enforced main-branch protection                                            |
| 12 — Harness PR Pipeline   | Implemented and verified | Real GitHub PR webhook, Harness Cloud checks, deliberate TS2322 failure followed by successful fixed-commit execution       |
| 13 — Artifact Pipeline     | Published and verified   | Both immutable full-SHA images pulled by digest; baked versions match; Docker-format native CD artifact resolution succeeds |
| 14 — Harness CD            | Implemented and verified | Manual release #9 and webhook release #10 pass validation, publishing, native migration/deployment and external smoke       |
| 15 — Documentation         | Implemented and verified | Architecture, reasoning, real walkthroughs, study/demo guides, trial operation and manual/automatic deployment evidence     |
| 16 — Learning Pass         | Deferred by owner        | Owner requested implementation first and learning later; independent exercises remain the owner's work                      |

Phases 1–15 have working implementation and verification. Production sample-data
preparation separately awaits the owner's explicit approval; the learning pass
remains deferred. The owner explicitly authorized automatic
review/merge of project PRs after required checks pass on 25 October 2026,
overriding the original owner-inspection procedure while preserving branch
protection. See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for that instruction and
verified release corrections, [ARCHITECTURE.md](ARCHITECTURE.md) for the system,
[WALKTHROUGH.md](WALKTHROUGH.md) for real request traces, and
[STUDY_GUIDE.md](STUDY_GUIDE.md) for the owner's later learning pass.

See [PHASE_11_12.md](PHASE_11_12.md) for the
GitHub/Harness report and execution links, [PHASE_09_10.md](PHASE_09_10.md) for the
testing/Docker report, [PHASE_07_08.md](PHASE_07_08.md) for dashboard/polish,
and [PHASE_05_06.md](PHASE_05_06.md) for the
authentication/task report. [PHASE_13_14.md](PHASE_13_14.md) records the release
implementation, protected-trial setup and actual deployment evidence. The original Phase 3/4 work
and its tests/documentation are recorded below. A phase's code completion does not certify
that the developer can explain it yet. The study checks below support that goal.

## Trace a project creation

1. `apps/web/src/pages/ProjectFormPage/ProjectFormPage.tsx` composes the page.
2. `features/projects/components/ProjectForm.tsx` collects and validates input.
3. `features/projects/hooks/useProjects.ts` runs a TanStack Query mutation.
4. `features/projects/api/projects.api.ts` selects the project endpoint.
5. `lib/api/client.ts` encodes JSON, sends the request, and translates errors.
6. `apps/api/src/modules/projects/project.routes.ts` chooses the middleware and controller.
7. `middleware/require-auth.ts` checks the cookie session and supplies its authenticated owner.
8. `middleware/validate-body.ts` applies `project.schema.ts` before the controller.
9. `project.controller.ts` calls the service and returns a 201 response.
10. `project.service.ts` coordinates the use case and constructs the public DTO.
11. `project.repository.ts` uses the existing Prisma client to write PostgreSQL.
12. The mutation invalidates the project cache; the detail page reads the stored
    project, and returning to the list shows refreshed data.

The frontend knows how to display and submit projects. The backend controls
accepted fields and ownership. The repository owns database queries. No Prisma
model is imported into browser code.

## Decisions to understand

- A **DTO** is the public data shape crossing the API boundary. Dates become
  strings; owner and password internals do not cross that boundary.
- **Validation** asks whether input has an acceptable shape. **Authorization**
  asks whether the caller may operate on the selected record. They are different
  checks. Authentication now supplies the owner used by repository queries.
- **Cache invalidation** marks old browser data stale so TanStack Query reloads
  it after a successful change. Components do not keep a second project list.
- **PATCH** changes only supplied fields. Missing description keeps its value;
  `null` clears it. An empty PATCH is rejected.
- **Cascading deletion** removes a project's tasks inside PostgreSQL when the
  project is deleted. The UI first explains the consequence and requires a second
  explicit action. There is no archive/restore feature.
- **Integration tests** call the real Express app and isolated PostgreSQL.
  Frontend tests use controlled HTTP responses to test user behavior reliably.
  They complement each other; neither claims to be full browser E2E coverage.

The routing and cache behavior follow the official
[React Router declarative guide](https://reactrouter.com/start/declarative/installation)
and [TanStack Query invalidation guide](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).
UI tests follow [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Historical Phase 3/4 verification

- Formatting, lint, strict type checking, and production build checked.
- `npm test`: 17 API configuration tests and 9 frontend/client tests passed.
- `npm run test:integration`: 30 tests across 6 files passed against the isolated
  PostgreSQL service, including the existing database and seed tests.
- The running browser loaded the seeded projects and database-backed progress;
  the new-project form displayed an accessible validation error for an empty name.
  Project details and the delete-confirmation/cancel flow were also checked
  without changing existing development records.
- A clean `npm run dev` started Vite and the API successfully after replacing
  the stalled `tsx watch` wrapper with Node watch mode and the same tsx loader.
- No migrations or database models changed in Phases 3/4.
- No authentication, task editing, dashboard, deployment, or Harness work added.

At that stage the build emitted a non-failing JavaScript chunk-size warning.
Phase 10 now explicitly fixes the production build environment and supplies
same-origin frontend serving/container packaging; see its report above.

## Phase 3/4 learning checks (compare with the completed Phase 5 implementation)

Open the named files and answer these without asking AI to rewrite them:

1. Where does the project owner come from now, and why is that not login?
2. Why does a different owner's project return 404 on GET, PATCH, and DELETE?
3. Where is a whitespace-only project name rejected?
4. Which line causes the project list to refresh after a successful save?
5. Why does a deletion return 204 without JSON?
6. Which foreign key deletes tasks with their project?
7. Why do database tests use port 5433 instead of the development database?
8. What must Phase 5 remove before authentication can be considered complete?

## Phase 3/4 change report

New maintained files (paths relative to the repository root):

```text
packages/shared/src/project.ts
apps/api/src/errors/app-error.ts
apps/api/src/middleware/development-user.ts
apps/api/src/middleware/development-user.integration.test.ts
apps/api/src/middleware/validate-body.ts
apps/api/src/modules/projects/project.routes.ts
apps/api/src/modules/projects/project.schema.ts
apps/api/src/modules/projects/project.controller.ts
apps/api/src/modules/projects/project.service.ts
apps/api/src/modules/projects/project.repository.ts
apps/api/src/modules/projects/project.integration.test.ts
apps/web/vitest.config.ts
apps/web/src/test/setup.ts
apps/web/src/app/App.test.tsx
apps/web/src/components/ui/QueryError.tsx
apps/web/src/features/projects/api/projects.api.ts
apps/web/src/features/projects/hooks/useProjects.ts
apps/web/src/features/projects/components/ProjectForm.tsx
apps/web/src/features/projects/components/ProjectProgress.tsx
apps/web/src/features/projects/components/DeleteProject.tsx
apps/web/src/lib/api/client.ts
apps/web/src/lib/api/client.test.ts
apps/web/src/lib/query/client.ts
apps/web/src/pages/ProjectsPage/ProjectsPage.tsx
apps/web/src/pages/ProjectDetailPage/ProjectDetailPage.tsx
apps/web/src/pages/ProjectFormPage/ProjectFormPage.tsx
docs/API.md
docs/PROJECT_PROGRESS.md
```

Existing files modified:

```text
.env.example
README.md
package-lock.json
apps/api/package.json
apps/api/src/app.ts
apps/api/src/config/env.ts
apps/api/src/config/env.test.ts
apps/api/src/middleware/error-handler.ts
apps/api/test/environment.ts
apps/web/package.json
apps/web/tsconfig.json
apps/web/src/app/App.tsx
apps/web/src/main.tsx
apps/web/src/styles/global.css
packages/shared/src/api.ts
packages/shared/src/index.ts
docs/DATABASE.md
```

The local ignored `.env` gained only the temporary `DEV_USER_ID` entry. Existing
credentials were preserved. The pre-existing uncommitted foundation files were
retained; no commit was created and the specification/AGENTS instructions were
not edited. Build outputs and generated Prisma files remain ignored.

| Commands performed                                                        | Result                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| npm install for React Router, TanStack Query, Zod, RTL, user-event, jsdom | Dependencies installed and lockfile updated; npm reported zero vulnerabilities |
| npx prettier --write on affected files; npm run format:check              | Passed after formatting corrections                                            |
| npm run db:validate                                                       | Existing Prisma schema valid                                                   |
| npm run lint                                                              | Passed, no warnings                                                            |
| npm run typecheck                                                         | Passed across root and all workspaces                                          |
| npm test                                                                  | 26 tests passed                                                                |
| npm run test:integration                                                  | 30 tests passed on isolated PostgreSQL                                         |
| npm run build                                                             | Passed; non-failing chunk-size warning documented above                        |
| git diff --check                                                          | Passed                                                                         |
| npm run db:up; npx prisma migrate deploy; npm run db:seed                 | Development DB ready; no pending migration; repeatable seed completed          |
| npm run dev                                                               | Vite and API started; browser checked against real seeded data                 |

Resolved environment/check failures: sandbox DNS prevented the initial install;
the installation succeeded with network access. Docker startup failed on a stale
socket; restarting its failed backend recovered the engine without deleting
volumes. A sandbox temporary-file error interrupted one Vitest run; rerunning
outside that sandbox passed. An optional matcher library conflicted with Vitest
types and was removed; tests use standard assertions without type suppressions.
The API watcher startup fix is described above. No unresolved functional or test
failure remains for these two phases.

Suggested commit message (when reviewing/staging this slice):
`feat: implement backend and frontend project slices`
