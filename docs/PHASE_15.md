# Phase 15 documentation and final audit

Updated 26 October 2026. The explanatory guides are implemented against the
actual repository. The first full Harness CD release passed; its commit, image
digests, migration, revision and external checks are recorded in
[PHASE_13_14.md](PHASE_13_14.md). The enabled main-push trigger's first automatic
execution is the final automation follow-up. Documents alone do not certify a
working deployment or independent understanding.

## Reading order

1. [README.md](../README.md): what runs, setup, commands and documentation links.
2. [ARCHITECTURE.md](ARCHITECTURE.md): boundaries, data/auth/task/delivery diagrams,
   state ownership and current operating limits.
3. [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md): problem, alternatives, decision and
   tradeoffs, including real Harness compatibility failures and their fixes.
4. [WALKTHROUGH.md](WALKTHROUGH.md): actual files/functions for task creation,
   login, project creation, dashboard, PR validation and release execution.
5. [API.md](API.md), [DATABASE.md](DATABASE.md): HTTP contracts and persistent model.
6. [TESTING.md](TESTING.md), [DOCKER.md](DOCKER.md): verification and packaging.
7. [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md), [HARNESS.md](HARNESS.md): protected PRs,
   resource map, each stage/step/secret reference and failure diagnosis.
8. [DEPLOYMENT.md](DEPLOYMENT.md), [identity plan](DEPLOYMENT_IDENTITY_PLAN.md):
   exact deployment configuration, permissions, secrets, migration/recovery and trial lifecycle.
9. [DEMO_GUIDE.md](DEMO_GUIDE.md): private demonstration-account preparation and a
   five-minute interview route without exposing credentials.
10. [STUDY_GUIDE.md](STUDY_GUIDE.md), [LEARNING_LOG.md](LEARNING_LOG.md): sixteen
    days of reading, questions and independent exercises, with a blank personal log.

## What changed and why

Created `ARCHITECTURE.md`, `DESIGN_DECISIONS.md`, `WALKTHROUGH.md`, `STUDY_GUIDE.md`,
`LEARNING_LOG.md`, `DEMO_GUIDE.md` and this report. Updated README, Harness,
deployment, identity, GitHub workflow and phase/progress reports to remove stale
claims and connect explanation to actual evidence. API documentation also
records the new response request-ID header.

The final source audit found that spec sections 44/45 described request IDs but
they had not been implemented. PR #8 added `logging/request-context.ts` and
`middleware/request-logging.ts`, reused the existing Pino logger and mounted it
for API requests. It generates server-owned UUIDs, carries them through async
work and records completion status/timing without bodies, queries or cookies.
Two new tests cover secret omission and concurrent context isolation; existing
app tests assert headers on success and 404. No API JSON contract, business logic,
database migration or dependency was added.

Release work retained the existing architecture and native Harness templates.
The version-forwarding, credential, image-format and generated-workspace fixes
are explained as observed problems with explicit tradeoffs. No Kubernetes,
Redis, microservices, second API client or production seed was introduced.

## Owner instruction and learning status

The owner authorized automatic agent review/merge after required checks pass,
replacing the original manual owner-inspection procedure. All PRs still use
normal protected merges and required exact-head Harness status checks.

The owner requested implementation/documentation first and learning later.
Phase 16 is therefore deferred, not completed by AI. Its eight manual exercises
remain in the study guide. The personal learning log is deliberately blank.
Generated explanations and passing tests cannot prove independent understanding.

## Verification

Application verification passed: formatting, lint, strict TypeScript, schema,
unit/frontend, real PostgreSQL integration/coverage, production build, both
Chromium workflows and Docker production checks. There are 126 unique tests;
coverage/Docker repeat existing tests and do not increase that count.

New documentation was formatted and relative links checked. Diffs were reviewed
against the original specification and latest owner instructions. Every PR's
required Harness gate runs again before automatic merge. Commands include:

```sh
npx prettier --write README.md docs
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:coverage
npm run test:e2e
npm run build
npm run test:docker
git diff --check
```

The spec and AGENTS instructions remain unchanged by formatting. The earlier
Windows sandbox Vitest temp-file issue was resolved by a successful unrestricted
rerun. Test lint errors were fixed without suppressions. The real release repeated
all CI checks, migrated the database, deployed the published image and passed its
external smoke step. Both images were pulled by digest and their baked versions
checked. Public HTTPS, HSTS, request IDs and unauthenticated 401 behavior were
also verified. Native-template schema checks and an offline exact-vendor-plugin
probe complement this real execution; neither replaces it.

The final evidence update modifies README, deployment/design/progress/phase
guides and the existing release trigger. It adds no application feature, schema,
dependency or test. The significant fixes were native project inputs and
manifest-only job mode; tests for application behavior remain unchanged.

Suggested documentation commit: `docs: explain delivery evidence and project operation`.

## Concepts to understand later

Follow one request rather than memorizing files. Separate authentication from
ownership, validation from TypeScript, database state from query cache, source
SHA from tag/digest, and migration from container deployment. Explain a failure
using evidence before changing permissions or removing a guard. Preserve the
trial limit and never describe this portfolio setup as highly available or
permanently free hosting.
