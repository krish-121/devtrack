# Artifact and Cloud Run deployment

This is the Phase 13/14 setup guide, not a record of a successful cloud release.
The user requires no charges and explicitly approved deployment using Google's
protected Free Trial without a paid upgrade. The trial, dedicated project,
immutable registry and approved scoped identities are set up. Harness's keyless
GCP connector passes its connection test, and its service/environment/target
definitions exist. The initial separate free Cloud SQL instance failed to
provision. The user then explicitly approved a small database using promotional
credit. It is running, with a verified limited app user and managed secret. The
release pipeline is saved but has not run; its trigger is disabled and
`release_enabled` defaults to false until reviewed main and live checks are ready.

## Verified setup on 24 October 2026

- Project: `devtrack-trial-krish-20261024`, number `656038155261`.
- Trial: console shows promotional credit and expiry on 23 January 2027;
  the account remains an unupgraded Free Trial.
- Registry: `us-central1/devtrack`, Docker format, immutable tags, no image yet.
- Identity: [approved roles and trust boundary](DEPLOYMENT_IDENTITY_PLAN.md).
  No user-managed service-account private keys were created.
- Harness: project-scoped `gcp` connector connection test succeeds. Service
  `devtrack` fetches the versioned manifest by the release commit expression.
  Environment `production` and infrastructure `cloud_run` exist; the target uses
  `${{ inputs.gcp_project }}`, region `us-central1`, connector `gcp`, service scope
  `devtrack` and simultaneous deployments `false`. Runtime execution is unverified.
- Pipeline `devtrack_release` is saved with Validate, Package and Deploy Production.
  Its primary GAR artifact `devtrack_image` selects package `devtrack` and the
  full commit from `inputs.release_commit`. The saved pipeline YAML
  was copied back from the editor and matched the prepared definition.
- The infrastructure UI's fixed project dropdown required an unavailable
  delegate. Its supported Expression mode saved the pipeline's explicit project
  input instead. This does not grant additional permissions or install a delegate.
- Cloud SQL `devtrack-postgres`: `FAILED` with `ERROR_STOCKOUT`; Google's selected
  Iowa zone lacked capacity for the fixed 8-CPU separate 30-day offer. It remains
  untouched; do not upgrade it or confuse it with the new small instance.
- Cloud SQL `devtrack-postgres-small`: `RUNNABLE`, PostgreSQL 18, Enterprise
  `db-f1-micro`, 10 GB SSD, `us-central1-b`, no automatic storage growth. Connector
  enforcement is required, SSL mode is `ENCRYPTED_ONLY`, and no IP allowlist is
  configured. One daily backup is retained; point-in-time recovery is disabled.
  Backup usage is additional to the compute/storage estimate below.
- Database `devtrack` is owned by login `devtrack_app`, which has no superuser,
  database-creation, role-creation or replication permission. Bootstrap login was
  verified; the database had zero application tables before release migration.
- Secret `production_database_url`, version `1`, is enabled in Google Secret
  Manager with only the approved runtime identity granted secret access. Neither
  its value nor the database password is stored in Git or a Harness Run step.
- No GAR image push, production migration, Cloud Run service/job or public demo
  exists yet. Local Unix-socket migration/app verification passes.

The user wants the demo available for internship interviews. Do not shut it down
after the first demonstration without their agreement. Trial expiry is still a
hard limit under the no-paid-upgrade requirement. Preserve deployment evidence
and export database data before expiry; a recording can support later interviews.

## What Google Cloud supplies

Google Artifact Registry stores the built container; Cloud Run runs it behind an
HTTPS address. Managed PostgreSQL stores accounts, sessions, projects and tasks
separately. Harness coordinates validation, publishing and deployment. These are
the providers required by PROJECT_SPEC.md; changing providers needs an explicit
spec decision. The application and its local Docker/tests remain usable without
an active Google Cloud account.

Google's protected Free Trial lasts 90 days or until its $300 credit is spent.
It requires payment verification, but does not automatically upgrade to paid
billing. If left unupgraded, resources stop when the trial ends; Google's
30-day recovery period is followed by deletion. Export database data before the
trial ends. Source, migrations and build instructions remain in Git, so another
approved environment can be created later. They do not preserve production data
by themselves. See [Google's Free Trial terms and lifecycle](https://docs.cloud.google.com/free/docs/free-cloud-features).

Free Tier allowances on a paid billing account are not a spending cap. Cloud Run
scale-to-zero/max-one settings reduce usage but cannot guarantee a zero bill.
Cloud SQL is not a permanently free database. No paid upgrade is authorized.
The small standard Cloud SQL instance was explicitly approved and created using
promotional credit. At the reviewed Iowa rate, `db-f1-micro`
compute is $0.0105/hour (about $1.76/week or $7.67/730-hour month), and 10 GB SSD
storage is approximately $1.70/month. These exclude networking, backups and other
services, and are estimates of credit consumption, not a guaranteed total or a
spending cap. See [Cloud SQL pricing](https://cloud.google.com/sql/pricing?hl=en).
The card-free [Starter Tier](https://docs.cloud.google.com/docs/starter-tier)
manages IAM/API access through AI Studio and does not provide the independent
Harness deployment access required here.

## Traceable local artifact

After reviewing and committing a clean working tree:

```sh
npm run artifact:build
```

`scripts/build-artifact.ts` builds `devtrack:<full-HEAD-SHA>` and checks the OCI
revision label. The Dockerfile embeds the same public SHA as `APP_VERSION`.
`.ci/local-artifact.json` records the commit, local tag and local Docker image ID.
The local image ID is not the registry manifest digest. This command does not
publish anything and does not claim Phase 13's registry proof.

For an approved registry, the repository argument is the complete untagged image
path, for example `REGION-docker.pkg.dev/PROJECT/REPOSITORY/devtrack`. The command
still only builds locally. Harness performs publishing during a release.

## Release pipeline and resource mapping

Git is authoritative for `infrastructure/harness/pipelines/devtrack-release.yaml`,
`infrastructure/harness/triggers/devtrack-release.yaml` and
`infrastructure/cloud-run/devtrack.yaml` and `migrate.yaml`. The release pipeline
is installed but has not executed yet. It uses the account's v1 pipeline dialect, while the
webhook uses the supported trigger wrapper. Official JSON-schema checks verify
structure; they do not prove native template expansion, IAM or deployment.

Use these project-scoped resource mappings; the verified setup above records
which ones already exist:

| Resource         | Required configuration                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Pipeline         | `devtrack-release`, ID `devtrack_release`; apply the versioned YAML                                                            |
| GitHub connector | Existing `github`, repository `krish-121/devtrack`                                                                             |
| GCP connector    | `gcp`, short-lived OIDC/Workload Identity Federation preferred                                                                 |
| Service          | `devtrack`, Google Cloud Run deployment type                                                                                   |
| Manifest source  | GitHub connector `github`, this repository, `infrastructure/cloud-run/devtrack.yaml`, fetched by the release's full commit SHA |
| Artifact source  | GAR/Docker, approved project/region/repository, package `devtrack`; explicit version equal to `inputs.release_commit`          |
| Environment      | `production`                                                                                                                   |
| Infrastructure   | `cloud_run`, approved GCP project/region and `gcp` connector; concurrent deployments disabled/queued                           |
| Google secret    | `production_database_url`, numeric secret version matching `database_secret_version`                                           |
| Runtime identity | Dedicated Cloud Run service account; access only to the required database secret                                               |

The app and migration job reference the same pinned Google secret version.
Harness orchestrates the job and its secret reference; its CI Run steps do not
receive the database credential. This avoids duplicating the secret into a second
store. No secret values belong in YAML or execution logs.

The first two real releases stopped before publishing: this account did not
provide the documented `HARNESS_OUTPUT` file variable or resolve `codebase.sha`
into the Run step's environment. The pipeline therefore requires the explicit
`release_commit` input for image tags, build metadata, manifest fetch, artifact
selection and smoke expectations. Its first step verifies that this input equals
the clean checked-out commit and current remote `main`. A mismatched or short SHA
fails before publishing. For manual execution, supply the same full SHA in both
the clone configuration and `release_commit`. The main-push trigger supplies both
from `<+trigger.commitSha>`. No undocumented metadata alias or custom cross-stage
output is required; all release guards remain enabled.

Use a dedicated Docker-format GAR repository with immutable tags. Resolve and
record its manifest digest after publishing. The service must select the exact
full-SHA tag produced by Package, preferably pinned to that returned digest,
never `latest` or a moving branch. Harness injects the resolved image into the
Cloud Run manifest. Verify these service bindings in the real account before
enabling the trigger; the pipeline alone cannot create them.

The account's native stable `buildAndPushToGAR` template uses BuildX/caching for
OIDC. The documented `@1.0.0` version did not exist in this account. Inspecting
the native editor established the actual inputs: `host`, `project_id`,
`image_name`, `build_args` with `path1`/`path2` entries, `context`, `target`, `tags`
and `caching`. The repository uses that saved form. The pipeline publishes the
`runtime` target as `devtrack:<SHA>` and the separate `migrations` target as
`devtrack-migrations:<SHA>`. Both bake the same `APP_VERSION`. A real execution
must still prove publishing, metadata and artifact resolution; schema validity
alone does not prove it. The local Docker suite verifies both targets.

Use the approved project's number and region to configure the default origin
`https://devtrack-PROJECT_NUMBER.REGION.run.app`; verify it against Cloud Run's
actual URL. Google documents this [deterministic HTTPS format](https://docs.cloud.google.com/run/docs/triggering/https-request).
`APP_ORIGIN` must match the browser origin exactly, with no trailing slash.
Public invoker access is a separate IAM decision; `ingress: all` alone does not
grant it. No load balancer or custom domain is needed for this V1 setup.

## Identity and database prerequisites

Create a dedicated release identity. Bind Harness's account-specific OIDC issuer
to a Workload Identity Provider, restrict its accepted account claims, and grant
only the required service-account impersonation. Do not create a long-lived JSON
key or grant Owner to simplify setup. The bootstrap administrator's ability to
create IAM resources is separate from the pipeline's runtime permissions.

Scope GAR writer access to the selected repository. Grant Cloud Run deployment
permissions on the intended project/service and `iam.serviceAccounts.actAs` only
on the dedicated runtime identity. Give the appropriate Cloud Run service agent
repository read access where needed. Give the runtime identity Secret Accessor
only on the database secret. Add monitoring/logging read permissions only if the
selected Harness verification requires them. Record the exact granted roles and
resource scopes after approval. The approved grants already applied, including
the secret-specific accessor, are recorded in
[DEPLOYMENT_IDENTITY_PLAN.md](DEPLOYMENT_IDENTITY_PLAN.md).

The app and one-time migration job use Cloud Run's authenticated Cloud SQL socket.
Both manifests specify the connection name through
`run.googleapis.com/cloudsql-instances`; only the runtime identity connects.
The secret URL uses a `localhost` placeholder hostname and an encoded
`host=/cloudsql/PROJECT:REGION:INSTANCE` query parameter. The connector handles
encryption to Google. There is no public database IP allowlist or VPC connector.
Local Docker checks exercise this URL form for both Prisma migrations and the
app's PostgreSQL adapter. See [Google's Cloud Run connection guide](https://docs.cloud.google.com/sql/docs/postgres/connect-run).

Bootstrap used the official, checksum-verified Cloud SQL Auth Proxy 2.26.3 bound
only to localhost:5435 and the user's existing CLI login. The temporary proxy was
stopped afterward; the cloud database remains running. App/root passwords are
random, held in ignored local Windows-encrypted recovery files, and never echoed.
The bootstrap corrected a typed SQL parameter and temporarily enabled the admin's
ability to set the newly created role while assigning database ownership, then
disabled that ability again. The application received no administrative role.

## Execution and failure behavior

1. **Validate** refuses disabled releases and non-current-main checkouts, then
   installs pinned tools and runs format/schema/lint, types, tests, real isolated
   PostgreSQL integration/coverage and the production build.
2. **Package** rechecks main, builds each Docker target once with the full commit
   SHA and publishes the app and migration-tools images to GAR.
3. **Deploy Production** rechecks main and installs smoke tooling. A Run step
   renders only public job configuration to `.ci/migration-job.yaml`, quoting each
   replacement as a JSON string so it cannot inject YAML. The native
   `googleCloudRunJobStep` uses `manifest` and `execute_cmd_options: --wait` (the
   actual account-supported keys), replaces the job and waits for completion.
   Only then does the native deploy step deploy the primary app artifact, followed
   by `npm run smoke:deployment -- HTTPS_ORIGIN FULL_SHA`.

`verify-release-source.sh` rejects dirty checkouts and commits other than remote
main. A newer merge makes an older in-flight release fail its next guard; it
does not silently substitute newer source. Queue production executions so two
migrations cannot race. Ordinary PR validation has no publishing/deployment step.

`migrate-production.ts` requires an explicitly supplied production environment,
HTTPS origin, database URL and full SHA before invoking `prisma migrate deploy`.
Prisma configuration skips local `.env` loading in production. The application
runtime contains no Prisma CLI and never migrates or seeds on startup. The
separate migration image runs that entry point as user `node`; the job has one
task, parallelism one, zero retries and a five-minute task timeout. A failed
migration stops deployment. Review SQL for backward compatibility: restoring an
older container does not reverse a schema change or recover deleted data.

The Cloud Run manifest uses port 8080, one CPU/512 MiB, minimum zero and maximum
one instance, concurrency four, a bounded startup probe, and a dedicated runtime
identity. `APP_VERSION` stays baked into the image. `TRUST_PROXY_HOPS=1` assumes
direct Cloud Run HTTPS ingress; verify actual forwarded client addresses before
release. Changing the proxy topology requires reviewing this value. The limiter
remains per-process/in-memory and resets on restart; this is not a global quota.
Opaque database sessions do not require an unused `AUTH_SECRET`.

The external smoke checks health, the exact version, and the frontend document;
redirects, wrong versions and failed responses fail the release. A smoke failure
does not automatically roll back the database. Investigate logs, then route
traffic back to a known-good existing Cloud Run revision only when compatible
with the current schema. Never rebuild an old tag or assume a destructive
migration can be reversed automatically.

Before enabling `devtrack_main_releases`, merge the reviewed application and
pipeline PRs, configure every required input/resource, inspect template expansion,
run a manually selected main commit and collect successful evidence. Then set
`release_enabled=true` in the reviewed trigger/input configuration and enable the
trigger. Its committed default is deliberately disabled under the no-cost limit.

## Evidence needed to complete Phases 13/14

- Main commit and successful Harness execution URL.
- GAR full-SHA image tag and registry manifest digest.
- Matching OCI revision and `/api/v1/version` response.
- Harness service/environment/infrastructure/secret references with no values.
- Migration success, Cloud Run revision/image digest and deployment time.
- Public HTTPS health/version/frontend smoke success.

There is currently no live deployment URL, GAR digest or cloud success record.
Do not describe these phases as complete until that evidence exists.

References: [Harness GAR build](https://developer.harness.io/harness-platform/3.0/in-harness-3.0/pipelines/steps/ci),
[OIDC with GCP](https://developer.harness.io/continuous-integration/use-harness-ci/secure-harness-ci/configure-oidc-gcp-wif-ci-hosted),
[Cloud Run service/artifact setup](https://developer.harness.io/continuous-delivery/3.0/use-deployments/overview-3/google-cloud-run-services),
[Cloud Run infrastructure](https://developer.harness.io/continuous-delivery/3.0/use-deployments/overview-3/google-cloud-run-infrastructure).
