# Phase 13/14 implementation and remaining cloud work

Checked on 25 October 2026. Phases 1–12 remain implemented and verified.
**Phases 13 and 14 are not complete end to end.** The repository implementation
and local checks are ready for review. The user activated Google's protected Free
Trial and approved scoped keyless deployment identities. The dedicated project,
immutable GAR repository and passing Harness GCP connection are set up. Harness
service `devtrack`, environment `production` and infrastructure `cloud_run` exist.
The saved release pipeline and service artifact binding use the account's actual
native template inputs. Real publishing succeeded, but version metadata and
native CD authentication need correction before deployment.
The separate 30-day Cloud SQL offer failed with `ERROR_STOCKOUT`; the user then
explicitly approved the small credit-funded database. `devtrack-postgres-small`
is running with a limited app user and Google secret version `1`. No production
application migration, Cloud Run deployment or paid billing upgrade exists.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the verified resource map and credit
estimate, and [DEPLOYMENT_IDENTITY_PLAN.md](DEPLOYMENT_IDENTITY_PLAN.md) for the
approved permissions. Keep the demo available for interviews during the trial;
do not shut it down after its first demonstration without the user's agreement.

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
- Added a separate non-root Docker `migrations` target and a one-time Cloud Run
  Job manifest. Both the job and app use authenticated Cloud SQL sockets and the
  same pinned managed secret. The job waits for completion, has zero retries,
  and stops deployment on failure. No database credential enters CI Run steps.
- Verified the actual native Harness UI configuration: the stable GAR template
  uses `host`, `project_id`, `image_name` and `build_args` (`path1`/`path2` pairs),
  while the job uses `manifest` and `execute_cmd_options`. Real publishing later
  showed that the accepted build-argument pairs did not reach Docker; the
  prepared correction uses the official plugin's environment forwarding and
  makes both Docker targets reject missing versions. The documented GAR
  `@1.0.0` template did not exist in this account. The final saved pipeline was
  copied back and matched the prepared YAML; successful corrected CD is still required.
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
- `infrastructure/cloud-run/devtrack.yaml`, `migrate.yaml`
- `docs/DEPLOYMENT.md`, `docs/DEPLOYMENT_IDENTITY_PLAN.md`, this report

Modified:

- `.env.example`, `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`
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
were rejected before migration. Production bootstrap created only the limited
role and empty app database; no production application migration or seed has run. The shell
release guard passes Git Bash syntax checking and both source/artifact guards
reject the dirty working tree as intended.

Harness PR validation execution [#5](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/ci/orgs/default/projects/DevTrack/pipelines/devtrack_pr_validation/executions/goqY6ZA9SsKhOSw_6BT6yQ/pipeline)
passed for commit `6f384406981f4273859df449854294090775b830` (1 minute 59 seconds).
That validates the PR code; it is not a release/deployment execution.

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

The approved small-database follow-up changed `Dockerfile`, `docker-compose.yml`,
`scripts/test-e2e.ts`, both Cloud Run manifests and the release YAML. Documentation
updates cover `README.md`, `DEPLOYMENT.md`, `DEPLOYMENT_IDENTITY_PLAN.md`,
`HARNESS.md`, `DOCKER.md`, `TESTING.md`, `PROJECT_PROGRESS.md` and this report.
Application features, schema and business logic did not change.

The Docker verification now migrates its fresh test database from the tools
container with networking disabled, using a shared Unix socket; it then repeats
the migration to verify a safe no-op and tests the app using that socket. Both
Chromium workflows and production security/version/shutdown checks passed.
`npm run test:coverage` passed all 94 API and 28 frontend tests with unchanged
coverage figures above. Formatting, lint, strict types, Prisma validation and
`npm audit --audit-level=low` passed; Docker builds compiled all production
workspaces. These checks did not connect to the production database.

Cloud setup commands used the official Google CLI to create/describe the small
instance, create the managed secret and apply the previously approved
secret-specific runtime binding. The checksum-verified official Cloud SQL Auth
Proxy 2.26.3 was used only for localhost bootstrap, then stopped. Root/application
passwords were never printed or committed. Resolved bootstrap issues were an
unsupported optional CLI label flag, PostgreSQL's required parameter type in
`format()`, and the admin's required temporary `SET ROLE` ability to assign
database ownership. None was worked around by granting the app administrative
roles or opening database IP access.

## Live release evidence

The owner reviewed and authorized PRs #1–4, and all four were merged through
normal protected checks. Reviewed main is now
`c2cd9b4fd3c90af0b486e8fea7d4a6cc5b77614e`.

[Release #3](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/LGHF64wQRqCbtIuPaV4usQ/pipeline)
passed the explicit source comparison, all Validate checks and both native GAR
publish steps. Both tags are the full reviewed SHA in
`us-central1-docker.pkg.dev/devtrack-trial-krish-20261024/devtrack`:

| Package               | Published digest                                                          |
| --------------------- | ------------------------------------------------------------------------- |
| `devtrack`            | `sha256:4248230dfb33de8afbe51f63f9197bad08d93b5f02792f3bc75d1053338cb2f4` |
| `devtrack-migrations` | `sha256:cf387a6a990158db5c558a9a0f4e976954f0e218b205d5383615b3b0ab412f22` |

Pulling the app by its registry digest confirmed a correct OCI revision label
but an incorrect `APP_VERSION=development`. Harness's automatic label is not
proof that the build argument reached Docker. These tags are audit evidence,
not approved deployable releases. Do not overwrite them; a corrected reviewed
commit must produce new immutable tags.

Native CD then failed at service artifact initialization using
`harnessdev/gar-artifact-metadata:0.0.1`: Google's exchange returned
`invalid_grant: Unable to parse the ID Token`. Source and artifact input values
resolved correctly. CI's successful OIDC publish does not prove the separate CD
plugin supports the same authentication path. No production migration or Cloud
Run service was created. The small database remains `RUNNABLE`.

The owner approved a separate credential-based CD connector for the same
limited release identity; CI remains keyless. Its exact boundary and remaining
verification are recorded in [the identity plan](DEPLOYMENT_IDENTITY_PLAN.md).
No billing upgrade or additional IAM role was made.

The image guard regression checks passed for both Docker targets. The full
Docker suite passed both Chromium workflows, fresh/idempotent migrations and
production smoke, including version matching, non-root execution and HTTPS
policy. Formatting, lint, strict types, unit/frontend tests and build passed.
The first local unit attempt hit sandbox temporary-file `ENOENT` errors; rerun
outside that sandbox passed. Docker Desktop was initially stopped and was
started before the successful container run.

## What remains

Read [DEPLOYMENT.md](DEPLOYMENT.md) for the concrete resource/input map and trial
lifecycle. Live completion still needs review/merge and Harness validation of
the image-guard fix, proof of a correctly baked published version, the approved
CD credential upload/connection test, production migration and Cloud Run
execution. Existing cloud/Harness definitions do not prove a successful release.
Record the commit, registry digest, Harness run, Cloud Run revision/time and
external HTTPS smoke result. No successful cloud release evidence exists yet.

A release must use reviewed main. The main-push trigger stays disabled until
manual release, public HTTPS smoke and hosted workflows pass. Then create/enable
the real trigger and verify a main update runs the same release path. Keep the
app available during the protected trial; do not upgrade to paid billing.

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
ci: run secure Cloud SQL migrations before Cloud Run deployment
```
