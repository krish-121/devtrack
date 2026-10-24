# Phase 13/14 implementation and remaining cloud work

Checked on 24 October 2026. Phases 1–12 remain implemented and verified.
**Phases 13 and 14 are not complete end to end.** The repository implementation
and local checks are ready for review; the user's zero-charge requirement leaves
Google Cloud account setup, registry publishing and deployment unresolved.
No free trial, billing account, paid service or production database was created.

## What changed

- Added a clean-commit local image build with a full-SHA tag, baked version and
  OCI revision check. It records a local image ID without publishing.
- Added public `/api/v1/version` using the existing shared contract package.
- Added bounded reverse-proxy configuration and an auth limiter regression test.
- Added `devtrack-release` YAML: Validate → Package/GAR → migration → native
  Harness Cloud Run deployment → external health/version/frontend smoke.
- Added a disabled main-push trigger and a release-enabled input defaulting to
  false. Current-main guards reject dirty, PR or obsolete source.
- Added the Cloud Run service manifest and an explicit production migration
  entry point. The slim application image still does not contain migration
  tooling or run migrations at startup.
- Patched transitive `body-parser` 2.3.0 → 2.4.0 and `fast-uri` 3.1.8 → 3.1.9;
  the body-parser update also resolves `qs` to 6.16.1. Fresh installs report zero
  known npm vulnerabilities. See the
  [body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828) and
  [fast-uri advisory](https://github.com/advisories/GHSA-w74x-v6f9-j3xg).

Application architecture, authentication strategy, database schema, frontend
features and the existing non-deploying PR pipeline remain unchanged. No
staging environment, Kubernetes, second API client, production seed or automatic
database rollback was added. Phase 15 has not been started.

## Files

Created:

- `apps/api/src/modules/version/version.controller.ts`, `version.routes.ts`
- `apps/api/src/modules/auth/auth.rate-limit.test.ts`
- `scripts/build-artifact.ts`, `migrate-production.ts`, `smoke-deployment.ts`
- `infrastructure/harness/pipelines/devtrack-release.yaml`
- `infrastructure/harness/triggers/devtrack-release.yaml`
- `infrastructure/harness/scripts/verify-release-source.sh`
- `infrastructure/cloud-run/devtrack.yaml`
- `docs/DEPLOYMENT.md`, this report

Modified:

- `.env.example`, `Dockerfile`, `package.json`, `package-lock.json`
- `apps/api/src/app.ts`, `app.integration.test.ts`
- `apps/api/src/config/env.ts`, `env.test.ts`, `apps/api/test/environment.ts`
- `packages/shared/src/api.ts`, `index.ts`
- `prisma.config.ts`, `scripts/test-e2e.ts`
- `README.md`, `docs/API.md`, `DOCKER.md`, `HARNESS.md`, `PROJECT_PROGRESS.md`,
  `TESTING.md`

## Validation

Executed successfully after the dependency fixes:

```sh
npm ci
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

There are **124 unique application/browser tests**: 47 API unit, 47 API
integration, 28 frontend and two Chromium workflows. Coverage reruns unit and
integration tests; Docker reruns the same two workflows, so these are not added
again to the unique count. Coverage gates pass: API lines 98.59%, branches 92.51%,
functions 100%; frontend lines 94.01%, branches 88.65%, functions 92.46%.

New checks cover seven invalid version/proxy configurations, separate proxied
client limiter buckets/spoofed header handling, and the public no-store version
response. Docker checks baked metadata against the OCI revision, accepts the
matching deployed version and rejects a wrong expected SHA, while retaining
production security, runtime contents and clean shutdown checks.

The production migration command passed against only the disposable test
database on localhost:5433. Missing `DATABASE_URL` and a development version
were rejected before migration. No production SQL was executed. The shell
release guard passes Git Bash syntax checking and both source/artifact guards
reject the dirty working tree as intended.

The release pipeline and trigger pass the official Harness JSON schemas using
temporary `ajv-cli` tooling (not an application dependency):

```sh
npm exec --yes --package=ajv-cli -- ajv validate --spec=draft7 --strict=false --validate-formats=false -s .ci/verification/pipeline-v1.json -d infrastructure/harness/pipelines/devtrack-release.yaml
npm exec --yes --package=ajv-cli -- ajv validate --spec=draft7 --strict=false --validate-formats=false -s .ci/verification/trigger-schema.json -d infrastructure/harness/triggers/devtrack-release.yaml
```

Those schemas were downloaded from the official
[Harness schema repository](https://github.com/harness/harness-schema).
Schema validity is not proof that native template parameters, service artifact
bindings or GCP permissions work in the real account. Those checks remain open.

The restricted Windows shell initially blocked dependency downloads and Git Bash
temporary IPC objects. Repeating those checks with normal network/temporary-file
access succeeded. No source rule was suppressed to bypass the environment.
Npm's pending install-script notices and Playwright's color-variable warning are
non-failing tool notices; Prisma generation, native Argon2 and browser checks
all executed successfully.

## What remains

Read [DEPLOYMENT.md](DEPLOYMENT.md) for the concrete resource/input map and trial
lifecycle. Live completion needs an approved hosting arrangement, managed
PostgreSQL, scoped GCP identity and secret access, real Harness service/environment/
infrastructure configuration, GAR push, migration and Cloud Run execution.
Record the commit, registry digest, Harness run, Cloud Run revision/time and
external HTTPS smoke result. None of that cloud evidence exists yet.

The bootstrap PR is still awaiting user review/merge. A release must use reviewed
main, not publish unmerged application code just to make a pipeline turn green.
The main-push trigger stays disabled until the cost constraint and account-side
validation are resolved.

## Concepts to understand

- A Git SHA identifies source; an immutable tag names its image; the registry
  digest identifies the published manifest. A local Docker image ID is different.
- Harness's service describes what is deployed, environment describes the
  logical destination, and infrastructure names the real cloud project/region.
- Build once and deploy that artifact. Smoke testing checks that the expected
  commit is actually responding; it does not replace application tests.
- Database migrations have a separate lifecycle. Rolling back traffic to an old
  container does not undo schema changes or restore data.
- Trial expiry affects hosted resources. Git source plus a database export lets
  the project survive and be deployed elsewhere later with approval.

Suggested commit messages:

```text
feat: add traceable artifacts and deployment verification
ci: prepare disabled GAR and Cloud Run release pipeline
docs: record deployment setup and pending cloud verification
```
