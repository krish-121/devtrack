# Learn DevTrack in 16 days

This is a reading and practice plan, not a completed learning certificate. The
owner asked to study after implementation. Use a separate practice branch and
local disposable data; do not experiment against production or weaken main's
checks. Spend more time where needed. DSA preparation remains a separate priority.

Each day: read the files, run the behavior, answer without notes, then do the
exercise yourself. Ask for an explanation or review after trying; do not ask AI
to implement the exercise first. Record your own answers in [LEARNING_LOG.md](LEARNING_LOG.md).

| Day                      | Read and run                                                        | Explain without notes                                                                                 | Modify yourself                                                                                               |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1 — Repository           | README, ARCHITECTURE, root/workspace package files; run local setup | Why three workspaces? What starts the app? Where is the source of truth?                              | Add a useful documentation link on a practice branch and review your diff.                                    |
| 2 — React                | `App.tsx`, `ProjectsPage.tsx`, `ProjectForm.tsx`                    | What is a component? Which state is unsaved input? Why use a stable list key?                         | Change one form help message and verify its appearance.                                                       |
| 3 — HTTP and query cache | `lib/api/client.ts`, `projects.api.ts`, `useProjects.ts`            | What does fetch return? Why validate JSON? Why invalidate a query after saving?                       | Add a frontend assertion that a project save refreshes displayed data.                                        |
| 4 — Express              | `app.ts`, project routes, validation and error handler              | In what order does middleware run? Where is JSON parsed? Why must an API 404 remain JSON?             | Call an invalid API route and add a meaningful error-response test.                                           |
| 5 — Layers               | project controller/service/repository and mapper                    | What belongs in each layer? Where is ownership enforced? Why does a DTO serialize dates?              | Add a small project validation rule with matching boundary tests.                                             |
| 6 — SQL and Prisma       | DATABASE, schema and migration SQL                                  | What is a foreign key? Why an index? Why are migration files committed?                               | Write and run a local SQL query counting tasks by project/status.                                             |
| 7 — Authentication       | auth service/repository/cookie and require-auth                     | Hash vs encryption? Why store a token hash? How does logout revoke access?                            | Write an integration assertion that an expired session is rejected.                                           |
| 8 — Authorization        | task routes/service/repository, browser security                    | Authentication vs authorization? Why return 404 for another owner? Why reject cross-site mutations?   | Add an ownership regression case using two disposable users.                                                  |
| 9 — Testing              | TESTING, service/unit/API/frontend/E2E examples                     | Unit vs integration vs E2E? What can mocks miss? What does coverage fail to prove?                    | Add one useful API integration test for a missing boundary case.                                              |
| 10 — Docker              | Dockerfile, Compose, DOCKER                                         | Image vs container? Why multi-stage? Why a separate migration target?                                 | Build a local image with an explicit SHA and inspect its version.                                             |
| 11 — Git                 | GITHUB_WORKFLOW, PR template, commit history                        | Branch vs commit? What does a PR review? Why protect main?                                            | Make a small practice change, inspect the diff and open a PR.                                                 |
| 12 — Harness             | HARNESS, project connector/service/environment pages                | Pipeline vs step? What is a connector? Why do PR jobs lack production secrets?                        | Change a harmless step display name on a practice branch, then validate it.                                   |
| 13 — PR CI               | PR pipeline/trigger and Phase 11/12 evidence                        | How does a webhook select source? What blocks a bad merge? Why test the exact head SHA?               | Introduce a deliberate type error in a draft practice PR, observe failure, fix it; never merge the failure.   |
| 14 — Artifact            | build-artifact, Docker version guard, GAR receipt                   | Tag vs digest vs image ID? Why full SHA? Why was a correct label insufficient?                        | Verify a local image's baked version and write down the evidence.                                             |
| 15 — Deployment          | DEPLOYMENT, identity plan, release YAML/manifests                   | Who deploys vs who runs? Where is the DB secret? Why migrate before deploy?                           | Safely trace a new non-secret setting from validated env to a local container; do not publish secrets.        |
| 16 — Whole system        | WALKTHROUGH, architecture diagrams, running app                     | Trace UI to database and back. What happens on a failed migration? What stops when the trial expires? | Explain one request aloud, then diagnose it from browser Network, API code and SQL without AI implementation. |

## Required independent learning pass

The specification's Phase 16 remains your work. Complete these on practice branches:

1. Add a task status/priority label color without changing stored enum values.
2. Add or adjust project sorting by updated date with predictable tie ordering.
3. Add a validation rule at the authoritative boundary and explain frontend feedback.
4. Write an API integration test that would catch a real regression.
5. Deliberately break CI, find the responsible step and repair the cause.
6. Change one Harness step safely and verify its actual execution.
7. Add a non-secret environment variable end to end, validating it centrally.
8. Trace a production request from UI through API and database without exposing data.

These are exercises, not extra features silently added to V1. Decide their scope
on your practice branch. Do not claim completion until you can reproduce the work.

## Interview preparation

Be able to explain: one UI-to-database request, the table relationships, password
hashing/cookie sessions, owner filtering, cache invalidation, test isolation,
Docker targets, a failed CI check, SHA-to-image-to-deployment traceability, secrets,
and the deployment's cost/availability limits. It is fine to say AI helped build
the project; demonstrate what you can now change and debug independently.

Use [DEMO_GUIDE.md](DEMO_GUIDE.md) for a short demonstration. Describe only verified
work on your CV. A deployed portfolio app is not evidence of production scale,
high availability, or knowledge of advanced system design.
