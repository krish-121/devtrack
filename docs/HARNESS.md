# Harness PR validation

DevTrack uses two pipelines: PR validation proves a proposed change is safe to
merge; release validation packages and deploys an exact protected-main commit.
Real execution evidence and current completion status are in
[PHASE_11_12.md](PHASE_11_12.md) and [PHASE_13_14.md](PHASE_13_14.md).
The release guide is [DEPLOYMENT.md](DEPLOYMENT.md). The PR pipeline below remains
non-deploying and receives no production secrets.

The pipeline is named `devtrack-pr-validation` (identifier
`devtrack_pr_validation`). It belongs to project `DevTrack` in organization
`default`. Its versioned definition is
`infrastructure/harness/pipelines/devtrack-pr-validation.yaml`; the PR trigger is
`infrastructure/harness/triggers/devtrack-pr-validation.yaml`.

## Connection and storage

Use the project-scoped GitHub connector `github`, restricted to
`krish-121/devtrack`. Authorization is held by Harness, never by a committed
token. The repository contains public example test database credentials only.
No production secrets are needed by this pipeline.

Git is the source of truth. Apply the exact versioned YAML to the inline Harness
pipeline, and commit every configuration change alongside its applied copy.
Harness's Git-storage branch picker exposed only `main` during bootstrap even
after the CI branch was pushed and verified with GitHub. Inline storage avoids
writing a pipeline directly to unreviewed `main`. PR code is checked out
separately using its PR number. Do not let an untrusted PR choose a pipeline
with broader secrets or deployment permissions.

The webhook listens for pull requests opened, reopened, or synchronized
(updated), targeting `main`. The trigger's `inputYaml` supplies the v1
`inputs.overlay.clone.ref` with `type: pull-request` and
`number: <+trigger.prNumber>`. Harness reports the
result to GitHub. This account's editor uses Harness v1 YAML: `id`, `repo`,
`clone`, and stage `steps[].run.script`, rather than the older v0 `identifier`
and `spec.execution.steps` layout. Organization/project scope is supplied by
the Harness resource, rather than fields in the v1 pipeline document.
The optional top-level `version: 1` marker is omitted: this account's backend
rejected it while the v1 editor/schema accepted it. The same document without
that marker saved successfully.

## What runs

One Linux amd64 Harness Cloud CI stage checks out the selected PR. Native Run
steps share the build machine's workspace. `setup-node.sh` reads `.nvmrc` and
`package.json#packageManager`, verifies the official Node archive checksum, and
installs the pinned Node/npm versions under ignored `.ci/`. Each later step
adds that location to `PATH`.

1. `npm ci` installs the committed lockfile and runs the existing Prisma/shared
   package generation.
2. `npm run format:check`, `npm run db:validate`, and `npm run lint` check source
   style, database schema, and lint rules.
3. `npm run typecheck` checks the root scripts and all workspaces strictly.
4. `npm test` runs API unit and frontend behavior tests.
5. `npm run test:integration` starts the existing disposable PostgreSQL Compose
   service, applies migrations, and runs real database/API tests.
6. `npm run test:coverage` enforces the existing coverage thresholds.
7. `npm run build` produces the production shared/API/web builds.

Both database steps use an EXIT trap to stop only `db-test` on success or
failure. The Cloud machine is disposable as well.

The Cloud machine must provide Docker Engine and Docker Compose. The setup step
checks both so missing infrastructure fails clearly. PostgreSQL is exposed only
on the ephemeral machine's loopback port 5433; the test runner supplies the
existing isolated `devtrack_test` environment. No development or production
database is contacted. No image publication or deployment happens in this PR
pipeline.

If Cloud is unavailable in the account, use the specification's local Docker
runner fallback and validate it before changing this runtime. Do not introduce
a Kubernetes cluster for this pipeline.

## Proving the check

Open a PR, commit one deliberate TypeScript error, and push it. Verify the real
Harness TypeScript step fails and GitHub records that failure on the same SHA.
Remove the error, commit, and push again. Verify the latest SHA passes all
steps. Record both execution links and SHAs in the phase report. A local test
or a saved pipeline definition alone does not complete this proof.

After observing the status context that Harness actually reports, require it
for `main` alongside a PR and up-to-date branch. Keep failed validation blocking
merge. Review and merge remain separate from creating and testing the PR.

The verified context is `devtrack_pr_validation-Validate`; it is now required
on `main`, including for administrators. See [PHASE_11_12.md](PHASE_11_12.md)
for the actual failed/fixed SHAs and Harness execution links.

## Harness resource map

Resources are scoped to organization `default`, project `DevTrack`, in the
owner's Harness account. A pipeline is the recipe; connectors hold authorized
connections; a service describes what to deploy; an environment names the logical
destination; infrastructure identifies its actual cloud location.

| Resource                                             | Purpose                                                                                                                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub connector `github`                            | Repository access restricted to `krish-121/devtrack`; clones PR or exact release commit.                                                                              |
| GCP connector `gcp`                                  | CI publishes to the dedicated GAR repository using OIDC and short-lived Google credentials.                                                                           |
| GCP connector `gcp_cd`                               | Approved compatibility fallback for native CD using the same limited release identity. It adds no IAM role.                                                           |
| File secret `devtrack_cd_credentials`                | One approved release-identity credential stored privately in Harness; referenced by `gcp_cd`, never placed in repository YAML or Run scripts.                         |
| Service `devtrack`                                   | Google Cloud Run service; fetches `infrastructure/cloud-run/devtrack.yaml` from the exact release commit and selects GAR package `devtrack` at the same full-SHA tag. |
| Environment `production`                             | Logical interview/demo destination; it is still a protected trial deployment.                                                                                         |
| Infrastructure `cloud_run`                           | Approved Google project and `us-central1`, connector `gcp_cd`, scoped to `devtrack`; simultaneous deployments disabled.                                               |
| Google secret `production_database_url`, version `1` | Runtime-only database connection. App/job read it through their runtime identity. Harness handles its reference, not its plaintext value.                             |

The release identity can publish to the one repository, manage Cloud Run in the
isolated project and act as the runtime identity. The runtime identity can connect
to Cloud SQL and read only its database secret. Neither has billing permissions.
The CD key must be revoked when the trial is retired or a verified native keyless
replacement is adopted. See the exact [identity plan](DEPLOYMENT_IDENTITY_PLAN.md).

## Release stages and steps

Definition: `infrastructure/harness/pipelines/devtrack-release.yaml`, ID
`devtrack_release`. It uses native Run, GAR publishing and Cloud Run templates.
The three stages run sequentially on Linux amd64 Harness Cloud machines.

| Stage / step                              | Why it exists and what failure means                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Validate / Source                         | Requires approved release enablement/project and exact current clean main source. Wrong/stale source stops before publishing.                    |
| Validate / Install                        | Reads pinned Node/npm, verifies official archive checksum, runs reproducible `npm ci`.                                                           |
| Validate / Lint                           | Checks formatting, Prisma schema and lint with zero warnings.                                                                                    |
| Validate / Typecheck                      | Checks strict TypeScript in root scripts and all workspaces.                                                                                     |
| Validate / Unit_tests                     | Runs API unit and browser-component behavior tests.                                                                                              |
| Validate / Database_tests                 | Runs real isolated PostgreSQL integration tests and coverage gates; stops the disposable test DB on exit.                                        |
| Validate / Build                          | Builds shared package, API and frontend in dependency order.                                                                                     |
| Package / Source                          | Rechecks current main so a newer merge cannot silently replace the reviewed source.                                                              |
| Package / Publish                         | Native `buildAndPushToGAR@1.3.2` builds the Docker `runtime` target and pushes its immutable full-SHA tag.                                       |
| Package / Publish_migrations              | Same native template builds/pushes the separate `migrations` target with the same SHA.                                                           |
| Deploy Production / native initialization | Resolves service, exact artifact, manifest and infrastructure before custom steps. Authentication/format errors here prevent any migration.      |
| Deploy Production / Source                | Rechecks current main; only the known generated root `cloud_run/` is ignored, while maintained source remains checked.                           |
| Deploy Production / Install               | Installs pinned smoke tools through the same reproducible dependency setup.                                                                      |
| Deploy Production / Prepare_migration     | Substitutes public settings and secret-version references into the job manifest under ignored `.ci/`; it never reads the secret value.           |
| Deploy Production / Migrate               | Native `googleCloudRunJobStep` replaces/runs the one-task job and waits. Zero retries; a migration failure stops the app deployment.             |
| Deploy Production / Deploy                | Native `googleCloudRunDeployStep` deploys the resolved published app image with its runtime identity, bounded resources and database socket.     |
| Deploy Production / Smoke                 | External HTTPS health, exact baked commit and frontend checks. Failure marks the release unsuccessful; it does not reverse a database migration. |

Package forwards public `APP_VERSION` through `PLUGIN_BUILD_ARGS_FROM_ENV`.
Both Docker targets reject absent or malformed versions. `BUILDX_NO_DEFAULT_ATTESTATIONS=1`
avoids an OCI-index format unsupported by this account's native CD reader;
optional attached provenance is omitted, while tag/digest/version checks remain.
See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for the observed failures and tradeoffs.

## Manual execution and trigger

Select **Run** in `devtrack-release`. Supply the same full current main SHA as
`release_commit` and the third-party GitHub clone's Commit SHA. Set
`release_enabled=true` only for this approved trial project. Keep the documented
project, region, repository, origin, runtime identity, SQL connection and numeric
secret version. Run preflight checks, then execute. Do not select an arbitrary
branch, PR, shortened SHA or `latest`.

The versioned main-push trigger is
`infrastructure/harness/triggers/devtrack-release.yaml`. It filters `targetBranch=main`
and forwards `<+trigger.commitSha>` into both release input and clone overlay.
Its actual enabled state and webhook proof are recorded in the release report;
a YAML file alone is not proof that a webhook exists or has executed.

For manual retries, inspect the failure first. Do not rebuild an already published
immutable SHA tag: a timestamp or dependency difference can produce another digest
that the registry correctly refuses. Prefer the supported retry of a failed CD
stage with the same artifact when the source remains current; a source fix needs
a new reviewed commit and new tags. Never delete/rewrite a tag to hide a failed run.

## Diagnosing common failures

- **No PR execution:** check the real webhook event/filter, PR number overlay and
  GitHub connector. Updating YAML without installing it does not update Harness.
- **Different source than expected:** compare the exact head SHA, checkout,
  release input and current remote main; do not remove the source guard.
- **Tests fail before loading:** distinguish code failures from a local Windows
  sandbox temp-file error; real Harness runs and the unrestricted local rerun
  provide separate evidence. Never mark a failed test as passed without rerunning.
- **GAR publish authentication:** check the approved OIDC issuer/account and
  repository scope. Do not grant Owner or billing roles.
- **Native CD token parsing:** this account needed `gcp_cd`; CI's working OIDC
  plugin does not prove native CD's separate metadata plugin works identically.
- **Artifact 404 although the tag exists:** check exact package/tag and media
  negotiation. Here the verified cause was an OCI index rejected by a Docker-only reader.
- **Dirty CD workspace:** inspect path-only output. Root `cloud_run/` is generated
  by Harness; a changed tracked file or another unknown path must still fail.
- **Migration failure:** inspect safe job logs and SQL compatibility. Do not seed
  production, rerun `migrate dev`, or deploy around the failure.
- **Smoke fails:** verify actual Cloud Run revision, URL access and version before
  investigating application behavior. Health alone does not check the database.

## References

- [Harness native Run step settings](https://developer.harness.io/docs/continuous-integration/use-ci/run-step-settings/)
- [Harness input sets and PR trigger examples](https://developer.harness.io/docs/platform/pipelines/input-sets)
- [Harness v1 pipeline schema](https://github.com/harness/harness-schema/blob/main/v1/pipeline.json)
