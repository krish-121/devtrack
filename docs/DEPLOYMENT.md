# Artifact and Cloud Run deployment

This is the Phase 13/14 setup guide, not a record of a successful cloud release.
The user requires no charges. Google Cloud billing/trial activation, cloud IAM,
registry creation, production PostgreSQL and deployment have not been approved
or performed. The release trigger is disabled and `release_enabled` defaults to
false. Keep both protections until the hosting decision and setup are complete.

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
Cloud SQL is not configured as a permanently free database. No paid upgrade,
Cloud SQL instance or third-party database account is authorized by this guide.
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
`infrastructure/cloud-run/devtrack.yaml`. The release pipeline is not installed
or executed in Harness yet. It uses the account's v1 pipeline dialect, while the
webhook uses the supported trigger wrapper. Official JSON-schema checks verify
structure; they do not prove native template expansion, IAM or deployment.

Configure these project-scoped resources only after hosting is approved:

| Resource         | Required configuration                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Pipeline         | `devtrack-release`, ID `devtrack_release`; apply the versioned YAML                                                               |
| GitHub connector | Existing `github`, repository `krish-121/devtrack`                                                                                |
| GCP connector    | `gcp`, short-lived OIDC/Workload Identity Federation preferred                                                                    |
| Service          | `devtrack`, Google Cloud Run deployment type                                                                                      |
| Manifest source  | GitHub connector `github`, this repository, `infrastructure/cloud-run/devtrack.yaml`, fetched by the release's full commit SHA    |
| Artifact source  | GAR/Docker, approved project/region/repository, package `devtrack`; explicit version equal to `stages.Validate.output.COMMIT_SHA` |
| Environment      | `production`                                                                                                                      |
| Infrastructure   | `cloud_run`, approved GCP project/region and `gcp` connector; concurrent deployments disabled/queued                              |
| Harness secret   | `production_database_url`, production-only credential; never a test database URL                                                  |
| Google secret    | `production_database_url`, numeric secret version matching `database_secret_version`                                              |
| Runtime identity | Dedicated Cloud Run service account; access only to the required database secret                                                  |

The Harness migration secret and Google runtime secret must resolve to the same
pinned credential version. A supported secret-manager reference is preferable
to independently maintaining values; verify that capability in the account
before setup. No secret values belong in YAML or execution logs.

Use a dedicated Docker-format GAR repository with immutable tags. Resolve and
record its manifest digest after publishing. The service must select the exact
full-SHA tag produced by Package, preferably pinned to that returned digest,
never `latest` or a moving branch. Harness injects the resolved image into the
Cloud Run manifest. Verify these service bindings in the real account before
enabling the trigger; the pipeline alone cannot create them.

The native `buildAndPushToGAR@1.0.0` template uses BuildX/caching for OIDC and
passes `APP_VERSION` as a build argument. Its build arguments and artifact/output
bindings still need account-side template resolution and a real execution.
Do not enable deployment if the template ignores those fields. The local Docker
suite already verifies the underlying Dockerfile and metadata behavior.

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
resource scopes after approval; none have been granted in this phase.

The selected managed PostgreSQL endpoint must accept TLS connections from both
Harness Cloud migration runners and Cloud Run. The current migration step does
not provide a private Cloud SQL socket, VPC tunnel or database proxy. A private
endpoint needs a deliberate networking change first. Select the provider,
region, connection limits, backup/export process and current price together;
none is chosen or provisioned yet. Keep production separate from local and CI.

## Execution and failure behavior

1. **Validate** refuses disabled releases and non-current-main checkouts, then
   installs pinned tools and runs format/schema/lint, types, tests, real isolated
   PostgreSQL integration/coverage and the production build.
2. **Package** rechecks main, builds the runtime Docker target once with the full
   commit SHA and publishes that tag to GAR.
3. **Deploy Production** rechecks main, installs transient migration tooling,
   runs `npm run db:migrate:production` once, deploys the selected published
   artifact, then runs `npm run smoke:deployment -- HTTPS_ORIGIN FULL_SHA`.

`verify-release-source.sh` rejects dirty checkouts and commits other than remote
main. A newer merge makes an older in-flight release fail its next guard; it
does not silently substitute newer source. Queue production executions so two
migrations cannot race. Ordinary PR validation has no publishing/deployment step.

`migrate-production.ts` requires an explicitly supplied production environment,
HTTPS origin, database URL and full SHA before invoking `prisma migrate deploy`.
Prisma configuration skips local `.env` loading in production. The application
runtime contains no Prisma CLI and never migrates or seeds on startup. A failed
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
