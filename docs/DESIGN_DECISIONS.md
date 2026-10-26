# Design decisions

Read alongside [ARCHITECTURE.md](ARCHITECTURE.md). Each decision records the
problem, alternatives, chosen approach and cost. These explain the implemented
V1; they are not a claim that these technologies suit every application.

| Problem                                         | Alternatives considered                                     | Decision                                                                                  | Tradeoffs                                                                                                                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interactive forms, lists and a dashboard        | Server-rendered templates, another UI framework             | React with Vite and React Router                                                          | Familiar component boundaries and fast local builds; requires explicit loading, error and cache behavior. No SSR requirement in this private task application.                                                                        |
| Keep browser, API and scripts consistent        | JavaScript only, separate languages                         | Strict TypeScript across npm workspaces                                                   | Catches shape mistakes early; runtime validation is still necessary. Shared contracts must stay free of backend-only dependencies.                                                                                                    |
| Small HTTP API understandable to a beginner     | Large framework, serverless functions per route             | Express with feature modules                                                              | Explicit request flow and little framework machinery; conventions and validation must be maintained by the project.                                                                                                                   |
| Organize one small application                  | Microservices, a flat collection of handlers                | Modular monolith                                                                          | Easy local execution and one deployable app; modules still require discipline to avoid tight coupling. Independent scaling is unnecessary for V1.                                                                                     |
| Related users, projects, tasks and sessions     | Document database, in-memory storage                        | PostgreSQL                                                                                | Foreign keys, transactions and aggregate SQL suit the data. A managed database has ongoing trial-credit usage.                                                                                                                        |
| Typed persistence and reviewed changes          | Raw SQL everywhere, another ORM                             | Prisma with committed SQL migrations                                                      | Readable typed queries and reproducible changes; generated client and adapter need build support. SQL CHECK constraints remain in migration SQL because the schema language does not represent them.                                  |
| A stable browser/server boundary                | GraphQL, direct database access                             | Versioned REST JSON at `/api/v1`                                                          | Simple HTTP semantics and tests; endpoint contracts need maintenance. DTOs intentionally differ from database models.                                                                                                                 |
| Validate untrusted input and responses          | Handwritten validators in every layer                       | Shared Zod contracts                                                                      | One contract vocabulary with inferred types; the backend still revalidates every request and applies ownership independently.                                                                                                         |
| Separate HTTP, use cases and persistence        | Everything in controllers, generic base repositories        | Route → validation → controller → service → repository                                    | More small files, but each has a clear purpose. No generic abstraction is added merely to remove a few similar lines.                                                                                                                 |
| Keep displayed server data fresh                | Manual fetch/effect state, Redux copies                     | TanStack Query hooks over one HTTP client                                                 | Central query keys, pending/error states and invalidation; developers must understand which mutations affect other queries.                                                                                                           |
| Authenticate a same-origin application          | JWT in localStorage, external identity provider             | Opaque cookie sessions stored as hashes in PostgreSQL                                     | Immediate logout/revocation and no browser JavaScript token access; each authenticated request looks up a session. No password reset or email verification in V1.                                                                     |
| Store passwords safely                          | Plaintext, fast general-purpose hash                        | Argon2id with explicit cost settings                                                      | Slower verification is intentional; rate limiting bounds abuse. A lost password cannot be recovered from its hash.                                                                                                                    |
| Avoid cross-origin credential complexity        | Separately hosted SPA and API                               | Same-origin production serving                                                            | Simpler cookies and browser policy; frontend and backend release together. Local Vite proxies `/api` while preserving this browser-facing boundary.                                                                                   |
| Package a reproducible app                      | Separate frontend/API hosting, host-specific build scripts  | One multi-stage Docker runtime image                                                      | Same image moves from registry to Cloud Run; requires Docker knowledge. Migration tools live in a separate target, not in the running app.                                                                                            |
| Demonstrate software delivery                   | GitHub Actions, manual console deployment only              | Harness CI/CD                                                                             | Harness is the project's learning differentiator. Vendor template behavior must be proven in real runs, not assumed from YAML validation.                                                                                             |
| Check PRs without exposing production access    | One pipeline with deployment branches                       | Separate PR validation and main release pipelines                                         | Some repeated quality steps; untrusted PRs do not get deployment credentials or production database secrets.                                                                                                                          |
| Tie a deployment to reviewed code               | `latest`, mutable branch tags                               | Full 40-character commit tags, immutable registry tags, digest evidence and baked version | More explicit inputs and storage; old images are auditable. Never overwrite a published tag to hide a failed attempt.                                                                                                                 |
| Host a small container without managing servers | VM, Kubernetes, Render                                      | Google Cloud Run as required by the spec                                                  | Managed HTTPS and scaling to zero; cloud IAM, trial expiry and external database costs still need understanding. Render is viable elsewhere, but switching it silently would abandon this spec's Harness/GAR/Cloud Run learning path. |
| Keep PostgreSQL reliable during interviews      | Local DB tunnel, self-managed VM, third-party free database | Small Cloud SQL instance in the protected Google trial                                    | Keeps the original managed-PostgreSQL architecture and app available during the trial. It consumes promotional credit continuously; it is not a permanent free database.                                                              |
| Avoid unnecessary operational complexity        | Redis sessions/cache, Kubernetes, multiple services         | PostgreSQL sessions and a single Cloud Run service                                        | Fewer systems to learn and debug. In-memory rate limiting is per instance, acceptable with the V1 one-instance cap; it would need review before scaling out.                                                                          |

## Verified release corrections

### Commit propagation

**Problem:** This Harness account did not supply the expected `HARNESS_OUTPUT`
file or resolve `codebase.sha` in a native Run environment. Schema-valid YAML
therefore failed in actual execution.

**Alternatives:** Guess other metadata aliases, introduce custom cross-stage
outputs, or supply one explicit input.

**Decision:** Require `release_commit`; compare it to the clean checkout and current
remote `main` before publishing/deployment. Use the same SHA for clone, artifact
tags, manifest source, version and smoke expectation.

**Tradeoff:** Manual runs require entering the full SHA twice. The push trigger
supplies both from the event. A stale or mismatched source fails closed.

### Build arguments

**Problem:** The native GAR template accepted nested `build_args` but dropped the
version argument. The image label was correct while the baked version was wrong.

**Alternatives:** Trust the label, replace native publishing entirely, or use the
BuildX plugin's supported environment forwarding.

**Decision:** Forward `APP_VERSION` with `PLUGIN_BUILD_ARGS_FROM_ENV`; both Docker
targets reject a missing/malformed SHA. Verify actual image configuration after
pulling by digest.

**Tradeoff:** More verification than a tag-only check, but it catches an incorrect
running `/version`. The next real release proved both targets baked the correct SHA.

### Native CD authentication

**Problem:** Native GAR metadata resolution failed its OIDC exchange, while CI
publishing with the same limited identity worked.

**Alternatives:** Broaden IAM, stop delivery, or use a separate approved credential
for the native CD connector.

**Decision:** Keep CI keyless. Use the user-approved `gcp_cd` fallback for CD with
one key for the existing limited release identity, stored in Harness. No extra
roles or billing permissions were added.

**Tradeoff:** A long-lived key needs revocation when the trial is retired or a
verified native keyless fix replaces it. See the identity plan; never commit it.

### Image format compatibility

**Problem:** The account's native CD reader requested Docker-v2 media only. The
registry returned 404 for that request and 200 when OCI indexes were accepted.
BuildX's default attached attestation produced such an OCI index.

**Alternatives:** Weaken artifact verification, wait for a reader update, or
publish the existing single-platform image without default attached attestations.

**Decision:** Set `BUILDX_NO_DEFAULT_ATTESTATIONS=1` in Package. Preserve immutable
SHA tags, baked versions and digest checks. This is a format compatibility setting,
not an authentication workaround.

**Tradeoff:** Optional attached provenance is omitted. Restore it after verifying
the account's reader supports the resulting OCI format. See
[Docker's variable reference](https://docs.docker.com/build/building/variables/#buildx_no_default_attestations).

### Native deployment workspace

**Problem:** Native CD fetched/rendered manifests into root `cloud_run/` before
the source recheck, making an otherwise clean checkout appear dirty. The first
guard stopped safely; a path-only diagnostic then identified the generated folder.

**Alternatives:** Remove the clean-source guard, delete generated deployment
files, or exclude the exact generated directory from source/build input.

**Decision:** Ignore root `/cloud_run/` in Git and `cloud_run` in Docker context.
Maintained manifests remain under `infrastructure/cloud-run/` and stay tracked.

**Tradeoff:** Nothing maintained may be stored in that root folder. Current-main
and tracked-file integrity checks remain mandatory; generated output does not
become application source.

### Native Cloud Run inputs

**Problem:** The native job template did not inherit its Google project. Adding
an explicit job name then selected execute-existing mode and ignored the manifest,
so a first deployment could not create the migration job.

**Alternatives:** Create the job manually, broaden permissions, or correct the
supported native template inputs.

**Decision:** Bind `project` explicitly on both native actions. Pass `manifest`
without `job` to the migration action, with `execute_cmd_options: --wait`. An
offline probe of the exact vendor plugin verified replace-before-execute behavior;
the real release then created the job and completed the production migration.

**Tradeoff:** Template schema validation cannot prove these runtime defaults.
Preserve the actual execution evidence and recheck behavior after plugin updates.
Cloud Resource Manager's control API supports SDK project validation; no Compute
API, extra IAM role, VM or manual deployment was needed.

## Development process change

On 25 October 2026 the owner explicitly replaced the spec's manual owner-inspection
gate with authorization for the agent to review and merge project PRs after
required checks pass. GitHub branch protection, required Harness validation and
normal PR merges remain enabled. The original specification is preserved as
history; this instruction changes the review procedure, not V1 architecture.

The owner also requested completion of the project and explanatory files before
their later learning pass. The learning exercises are therefore prepared rather
than implemented on their behalf or marked as learned.
