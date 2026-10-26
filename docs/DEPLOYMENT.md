# Artifact and Cloud Run deployment

This is the setup, operation and trial-lifecycle guide. The user authorized the
small database and deployment using protected Google Free Trial credit, with no
paid upgrade or cash charges. The first complete Harness release passed production
migration, native deployment and external HTTPS checks. The enabled main-push
trigger also completed its first automatic release after a protected PR merge.
[PHASE_13_14.md](PHASE_13_14.md) records exact manual and webhook evidence.
`release_enabled` still defaults to false for manual runs.

## Verified setup (updated 26 October 2026)

- Project: `devtrack-trial-krish-20261024`, number `656038155261`.
- Trial: console shows promotional credit and expiry on 23 January 2027;
  the account remains an unupgraded Free Trial.
- Registry: `us-central1/devtrack`, Docker format, immutable tags. The first app
  and migration images were published from reviewed main; their version check
  failed. Do not deploy or overwrite those immutable tags. See
  [the release evidence](PHASE_13_14.md#first-complete-harness-release).
- Identity: [approved roles and trust boundary](DEPLOYMENT_IDENTITY_PLAN.md).
  CI remains keyless. The owner separately approved one limited CD credential
  after the native artifact plugin failed to exchange its OIDC token. Connector
  `gcp_cd` is saved and tested; real native CD artifact resolution succeeds.
  No additional roles were added.
- Harness: project-scoped `gcp` connector connection test succeeds. Service
  `devtrack` fetches the versioned manifest by the release commit expression.
  Environment `production` and infrastructure `cloud_run` exist; the target uses
  `${{ inputs.gcp_project }}`, region `us-central1`, connector `gcp_cd`, service scope
  `devtrack` and simultaneous deployments `false`. The service's GAR artifact also
  uses `gcp_cd`; CI publishing retains the keyless `gcp` connector.
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
- The production migration job succeeded before the first Cloud Run revision
  became ready. The public origin is
  `https://devtrack-656038155261.us-central1.run.app`; the provider also returns
  `https://devtrack-sysiyhu6ua-uc.a.run.app`. Use the first origin consistently:
  it exactly matches `APP_ORIGIN` and cookie/origin protection.
- Only service `devtrack` grants `allUsers` the `roles/run.invoker` role so an
  interviewer can reach the website. App login and owner-scoped data remain
  required; the database has no public IP allowlist. No project-wide public role
  or other IAM permission was added.

The user wants the demo available for internship interviews. Do not shut it down
after the first demonstration without their agreement. Trial expiry is still a
hard limit under the no-paid-upgrade requirement. Preserve deployment evidence
and export database data before expiry; a recording can support later interviews.

On 26 October the refreshed console showed 88 days and ₹28,746.85 credit
remaining, with the Upgrade action still present. This is a point-in-time
observation, not a fixed spending cap or a promise of future availability. Keep
the account unupgraded. The console also displayed an account notice requiring
two-step verification by 1 November 2026; the owner should enable it personally
to retain console access. No account security setting was changed by the agent.

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
is installed and has executed six times. It uses the account's v1 pipeline dialect, while the
webhook uses the supported trigger wrapper. Official JSON-schema checks verify
structure; they do not prove native template expansion, IAM or deployment.

Use these project-scoped resource mappings; the verified setup above records
which ones already exist:

| Resource         | Required configuration                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Pipeline         | `devtrack-release`, ID `devtrack_release`; apply the versioned YAML                                                            |
| GitHub connector | Existing `github`, repository `krish-121/devtrack`                                                                             |
| GCP connectors   | `gcp` uses short-lived OIDC for CI; approved `gcp_cd` credential fallback handles native CD                                    |
| Service          | `devtrack`, Google Cloud Run deployment type                                                                                   |
| Manifest source  | GitHub connector `github`, this repository, `infrastructure/cloud-run/devtrack.yaml`, fetched by the release's full commit SHA |
| Artifact source  | GAR/Docker, approved project/region/repository, package `devtrack`; explicit version equal to `inputs.release_commit`          |
| Environment      | `production`                                                                                                                   |
| Infrastructure   | `cloud_run`, approved GCP project/region and `gcp_cd` connector; concurrent deployments disabled/queued                        |
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

The account's native `buildAndPushToGAR@1.3.2` template uses BuildX/caching for
OIDC. The documented `@1.0.0` version did not exist in this account. The native
editor accepted `build_args` with `path1`/`path2` pairs, but real execution
silently omitted the Docker build argument: the published image's label named
the correct commit while its baked `APP_VERSION` remained `development`.

The verified fix pins the observed stable template version and forwards the
public `APP_VERSION` through Package's environment with
`PLUGIN_BUILD_ARGS_FROM_ENV=APP_VERSION`, supported by the
[official BuildX argument parser](https://github.com/drone-plugins/drone-buildx/blob/master/app.go).
Both Docker targets reject an absent or malformed SHA, so failed forwarding
stops the build before publication. Real Harness publishing and digest-based
pulls proved both baked versions match the exact release SHA.
The pipeline publishes the
`runtime` target as `devtrack:<SHA>` and the separate `migrations` target as
`devtrack-migrations:<SHA>`. Both bake the same `APP_VERSION`. A real execution
must prove corrected version metadata and artifact resolution; schema validity
alone does not prove it. Those checks now pass, and the local Docker suite
also verifies both targets.

The next real release (`30f5d3783ffd60c180e990f63dc205b9fd538928`)
published both targets with the correct baked version, verified after pulling
each by registry digest. Native CD authentication also succeeded with `gcp_cd`,
but its GAR reader returned 404 for the OCI image index. A direct registry probe
reproduced 404 with a Docker-v2-only Accept header and 200 when OCI index types
were accepted. No production migration ran.

Package therefore sets `BUILDX_NO_DEFAULT_ATTESTATIONS=1` for compatibility
with that reader. For the existing single-platform Linux/amd64 release this
avoids the default attestation-bearing OCI index. Optional attached provenance
is not published by this V1 compatibility path; immutable SHA tags, baked
versions and registry digest verification remain required. This is an image
format workaround, not an authentication or IAM change. Restore the optional
attestations when an account-supported artifact reader has been verified to
accept them. See [Docker's setting](https://docs.docker.com/build/building/variables/#buildx_no_default_attestations)
and [image exporter media types](https://docs.docker.com/build/exporters/image-registry/).

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
key or grant Owner merely to simplify setup. The separately approved limited CD
compatibility fallback is documented in the identity plan; no further key or
broader access is authorized. The bootstrap administrator's ability to
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

Real native CD execution creates a root `cloud_run/` folder while fetching and
rendering the service manifest, before user-defined Run steps execute. Release
`ffec08ee46bb26ba4c99490fedb794b5d6bc4b71` proved this with the path-only diagnostic
`?? cloud_run/`. That generated folder is excluded from Git and Docker build
input. This does not ignore `infrastructure/cloud-run/`, relax tracked-source
checks or change the selected release commit. Do not put maintained source there.

The next native execution passed that guard, then exposed a separate template
default: the migration action received its connector and region but no Google
project (`PLUGIN_PROJECT` was absent). Both native job/deploy templates now bind
their supported `project` input explicitly to `inputs.gcp_project`. The native job
action must receive `manifest` without `job`: a nonempty job input selects
execute-existing mode and takes precedence over the manifest. With only the
manifest it reads `metadata.name`, replaces/creates the job, then executes it with
`--wait`. An offline probe of vendor plugin `1.0.10`, with a fake SDK, no network
and no credentials, verified that exact command order. This changes input wiring,
not IAM, credentials or the migration/deploy order. Cloud Resource Manager's
control API was enabled for SDK project validation; no compute resource or IAM
permission was added.

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

`devtrack_main_releases` was enabled only after the first complete manual release
and external checks passed. It selects GitHub Push events for `main`, passes the
event's full commit into both clone and release input, and uses the approved
trial configuration. Auto-abort is false; migrations are not interrupted by a
new push. Keep merges sequential while demonstrating releases because source
guards reject stale current-main checkouts. Disable this trigger when retiring
the trial; do not upgrade billing to keep it running.

## Evidence for Phases 13/14

- Main commit and successful Harness execution URL.
- GAR full-SHA image tag and registry manifest digest.
- Matching OCI revision and `/api/v1/version` response.
- Harness service/environment/infrastructure/secret references with no values.
- Migration success, Cloud Run revision/image digest and deployment time.
- Public HTTPS health/version/frontend smoke success.

The phase report records the first real successful migration, revision, digest,
public URL and HTTPS smoke evidence. Preserve this historical proof rather than
rewriting every document with each later release's SHA. The live `/api/v1/version`
reports whichever commit is currently deployed.

References: [Harness GAR build](https://developer.harness.io/harness-platform/3.0/in-harness-3.0/pipelines/steps/ci),
[OIDC with GCP](https://developer.harness.io/continuous-integration/use-harness-ci/secure-harness-ci/configure-oidc-gcp-wif-ci-hosted),
[Cloud Run service/artifact setup](https://developer.harness.io/continuous-delivery/3.0/use-deployments/overview-3/google-cloud-run-services),
[Cloud Run infrastructure](https://developer.harness.io/continuous-delivery/3.0/use-deployments/overview-3/google-cloud-run-infrastructure).
