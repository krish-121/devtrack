# Phase 13/14 release evidence

Updated 27 October 2026. **Phase 13 and the first full Phase 14 Harness deployment
are verified.** The production migration, native Cloud Run deployment and Harness
external smoke step all passed. The small database and app remain available
during the protected trial. There has been no paid billing upgrade.

The owner signed back in and release #7 proved the generated-workspace fix.
Its migration action then failed before job creation because the native template
did not supply its Google project. Release #8 proved the explicit project binding,
then exposed job-name precedence over the manifest. Manifest-only mode has now
passed an offline vendor-plugin probe and then the real release. No manual
application deployment was substituted for Harness CD.

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration and trial operation,
[HARNESS.md](HARNESS.md) for every stage/resource, and
[DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for the observed problems and choices.

## What is verified

- GitHub PRs #1 through #13 merged normally after required exact-head Harness
  validation. Main protection remains enabled. The owner explicitly authorized
  automatic agent review/merge on 25 October, replacing manual owner inspection.
- Harness PR CI has real failing-then-passing proof in [PHASE_11_12.md](PHASE_11_12.md).
- The release pipeline validates clean current main, builds two full-SHA images,
  publishes to immutable GAR tags and resolves the exact application artifact.
- Both published images for `a560ee3abc1f488791c18a895a7ff2823bc9a615` were pulled
  by registry digest and their actual `APP_VERSION` matched that SHA.
- Registry metadata identifies both as Docker-v2 manifests, and native CD
  service/artifact, infrastructure and manifest rendering all succeeded.
- `gcp` publishes with short-lived OIDC. The approved limited `gcp_cd` fallback is
  saved, passes its connection test and is bound to native CD. No IAM role was added.
- Google project, immutable repository, scoped identities, running small managed
  PostgreSQL database and pinned managed database secret are configured.
- PR #9 excludes only generated root `cloud_run/` output; PRs #11/#12 correct
  native project wiring and manifest-mode migration. The real release passed
  the unchanged tracked-source/current-main guards.
- Local real-database, browser and Docker checks pass, including fresh and repeated
  Unix-socket migrations, image version guards and production container security.

## Traceable artifact proof

This earlier artifact proof is retained as history. The first deployed artifact
is recorded below under **First complete Harness release**.

Repository: `us-central1-docker.pkg.dev/devtrack-trial-krish-20261024/devtrack`.
Full commit: `a560ee3abc1f488791c18a895a7ff2823bc9a615`.

| Package               | Registry manifest digest                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| `devtrack`            | `sha256:352322852d6b8892617eea985ed4f1fa233fa98e1f5f6c75066a6df081ea0514` |
| `devtrack-migrations` | `sha256:7bd562a7fd2b0e0078e2b628c92c6bf5fb9517330ac0e433d533fe334bffb8fd` |

This proves source-to-published-image identity. It does not prove a production
migration or running app. Later source fixes must publish their own new SHA tags;
never overwrite these immutable records. A Docker local image ID is different
from a registry manifest digest.

## Live execution history

| Run                                                                                                                                                                    | Source / outcome                                                                                                          | Why it matters                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1                                                                                                                                                                      | Failed before publishing: `HARNESS_OUTPUT` unavailable                                                                    | Actual account behavior differed from a generic example.                                                                 |
| 2                                                                                                                                                                      | Failed before publishing: `codebase.sha` unresolved                                                                       | Replaced guessed metadata with explicit `release_commit`, checked against checkout/current main.                         |
| [3](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/LGHF64wQRqCbtIuPaV4usQ/pipeline) | `c2cd9b4fd3c90af0b486e8fea7d4a6cc5b77614e`: Validate and Package pass; CD OIDC token parsing fails                        | Inspection found the correct label but incorrect baked `APP_VERSION=development`. These first tags must not be deployed. |
| [4](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/dtXsgPOySb-sj8EJ7lrQhw/pipeline) | `30f5d3783ffd60c180e990f63dc205b9fd538928`: both baked versions correct; CD authenticates but artifact lookup returns 404 | Registry Accept-header probe proves Docker-only lookup rejects the OCI index.                                            |
| [5](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/dRlGPpu1SK6mx7w3Z3zGbQ/pipeline) | `a560ee3abc1f488791c18a895a7ff2823bc9a615`: publish, artifact resolution and rendering pass; clean-workspace guard fails  | Docker format compatibility is proven; no migration ran.                                                                 |
| [6](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/gnwK0wEcQwK13pDs7VW30Q/pipeline) | `ffec08ee46bb26ba4c99490fedb794b5d6bc4b71`: same stages pass; path-only diagnostic shows `?? cloud_run/`                  | Identifies native generated output precisely. PR #9 fixes the workspace boundary without removing the guard.             |

[Release #7](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/aUvHhvaoSuC9qoUkkISFkw/pipeline)
used `2aed5de5e0cc5246ff7126817b5305f0b28cae78`. Validation, publishing, artifact
resolution, workspace guard, dependency setup and job-manifest preparation passed.
The native job action received its connector/region but omitted `PLUGIN_PROJECT`,
then stopped with “google cloud run project is not configured in env variables”.
The supported template keys `project` and `job` were confirmed in the account
editor. Explicit bindings preserve the same approved project/identity and job.

[Release #8](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/SIm9XmVgT26vYjzhNvIPvw/pipeline)
used `fdea5e077d9e15cc7c80d60db45e13dc2457ea06`. The native project binding resolved
correctly. Supplying `job: devtrack-migrate` selected execute-existing mode, which
ignored the manifest and returned NOT_FOUND before creating any job. An offline
probe of the exact vendor plugin with a fake SDK/no network/no credentials proved
that omitting `job` makes it read the manifest name, replace/create, then execute
with `--wait`. The correction removes that one input and keeps both explicit
project bindings. Cloud Resource Manager's control API was enabled to remove the
SDK's project-validation warning; it grants no IAM role and creates no compute.

Runs 1–8 stopped before creating a migration job or app. Preserve their audit
records rather than deleting failed executions or rewriting image tags.

## First complete Harness release

[Harness release #9](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/pVerDxXcR92S9PuO-k-CVQ/pipeline)
succeeded for protected-main commit
`c2f884020f41857ec22ca880654bba67cbd1c52b`, in 11m 37s. Validate, Package and
Deploy Production all passed, including the native migration and external smoke.

| Evidence                             | Verified value                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Public app / exact configured origin | <https://devtrack-656038155261.us-central1.run.app>                                        |
| First ready revision                 | `devtrack-00001-lmb`, created `2026-10-26T09:54:35.368632Z`                                |
| Application image digest             | `sha256:c2d9d517135479093002e48b97b45e65dff0101cf1bd87c62c38868cc89a8d1a`                  |
| Migration image digest               | `sha256:9b7f63ea00ff1e7b900fe9341281960e315da66645ee6c4429aa607fb2aa1ac3`                  |
| Migration execution                  | `devtrack-migrate-jhqvz`, one success, completed `2026-10-26T09:54:08.632737Z`             |
| Deployment                           | Native Harness deploy, 100% traffic to the ready revision; digest matches GAR              |
| Image contents                       | Both images pulled by digest; baked `APP_VERSION` and revision label match the full commit |
| External verification                | Harness and local HTTPS health, exact version and frontend smoke pass                      |
| Access controls                      | Unauthenticated project API returns 401; HSTS and generated request-ID header present      |

The observed native job image was `1.0.10`; native deploy was `1.0.11`. After
deployment the native action waited for Google's first instance-count metrics;
the app was already serving, and the action subsequently succeeded. This delay
did not require extra IAM, a VM or enabling Compute Engine.

Only the app service received public invocation. Application authentication,
ownership checks, restricted database/secret access and the protected trial were
preserved. These values record the first successful deployment, not a promise
that the live version never changes.

## Corrections and reasons

1. **Explicit source:** pass one full SHA to clone, release input, tags, manifest
   source, artifact selection and smoke expectation. Verify current main before
   publishing and deployment. A newer merge invalidates an older in-flight release.
2. **Baked version:** native nested build arguments were silently dropped. Forward
   `APP_VERSION` via the supported BuildX environment setting; both Docker targets
   reject absent/malformed SHAs. Verify the actual pulled image, not only its label.
3. **CD authentication:** the native metadata plugin failed OIDC parsing even though
   CI OIDC worked. Use the separately approved credential for the same limited
   identity in `gcp_cd`; do not broaden permissions. Revoke it at retirement or
   after a verified keyless replacement.
4. **Image format:** disable optional default attached attestations for this
   single-platform image so the current native Docker-only reader can resolve it.
   Keep immutable tags, digest evidence and baked-version checks.
5. **Workspace:** root `/cloud_run/` and `/dockerconfig` are generated by native
   Harness CD. Exclude those exact paths from Git/Docker input. Maintained
   `infrastructure/cloud-run/` remains tracked; the source guard is unchanged.

## Checks and changes

The final application change adds request-ID correlation described by spec
sections 44/45: generated `X-Request-ID`, async Pino context and completion logs
with method/path/status/duration. Query strings, credentials and request payloads
are omitted. No business behavior, API JSON shape or schema changed.

**126 unique tests:** 49 API unit, 47 real database/API integration, 28 frontend
and 2 Chromium workflows. Coverage and Docker rerun existing tests; they are not
added again. API coverage: lines 98.64%, branches 91.94%, functions 100%; frontend:
lines 94.01%, branches 88.65%, functions 92.46%. Required thresholds pass.

Executed successfully on the final application change:

```sh
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
git diff --check
```

Harness repeats format/schema/lint/types, unit/frontend, PostgreSQL integration,
coverage and build checks on every PR head and release. Docker verification
checks both missing-version build failures, fresh/idempotent migrations, both
browser workflows, version/frontend/health, configured port, non-root runtime,
image contents, HTTPS policy and graceful stop. No production data is used.

The initial local Vitest attempt encountered Windows sandbox temporary-file
ENOENT errors; an unrestricted rerun passed. A new test's unsafe matcher type was
fixed without suppressions; lint and strict types then passed. These failures
were resolved, not counted as successful tests.

Operational verification used `gcloud artifacts docker images list --include-tags`,
digest-pinned `docker pull` and `docker image inspect`, `gcloud run jobs executions
describe`, `gcloud run revisions describe`, and `gcloud logging read` with only
safe request fields selected. Public smoke used `npm run smoke:deployment --
HTTPS_ORIGIN FULL_SHA`. No production seed or manual application deployment ran.

The official Harness v1 pipeline and trigger schema checks passed. Real execution
was still necessary: the native argument, authentication and image-format issues
were not detectable from schema validation alone.

## First automatic main-push release

The real `devtrack_main_releases` trigger is enabled after manual success. Its
saved configuration selects Push, `targetBranch Equals main`, auto-abort false,
and the event SHA for clone/release inputs. The versioned YAML records the same
approved project and inputs.

Merging [PR #13](https://github.com/krish-121/devtrack/pull/13), after its required
exact-head [Harness validation](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/ci/orgs/default/projects/DevTrack/pipelines/devtrack_pr_validation/executions/YOGq1znkQY2TiALNhIx18w/pipeline?stage=wbMplqeTRGqNgA9QjpKYBA),
automatically started [release #10](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/Rkgl7sDOSPuNZwrqWYwPAA/pipeline).
Harness identifies its trigger as **Webhook**, with the merged commit
`621e9099e8df9c137124c180c8452b63bfbe6334`. All stages succeeded in 9m 41s.

| Evidence                 | Verified value                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Application image digest | `sha256:d5bb6ed7fe51c450c5791b0494f117af2cab069b7e6f50c98c6f21a9c18b2c82`                                      |
| Migration image digest   | `sha256:fe6ce390805f62672c67a6e49bf4dca4d1a65946adbdfd2f87cc9b84913d7016`                                      |
| Repeated migration       | `devtrack-migrate-pn8r9`, succeeded `2026-10-26T10:12:46.298256Z`                                              |
| Ready revision           | `devtrack-00002-jbd`, created `2026-10-26T10:13:16.418273Z`                                                    |
| Running version          | Deployed digest matches GAR; public `/api/v1/version` equals the full merged commit                            |
| Verification             | Full release CI gate, native migration/deploy and Harness external smoke pass; independent public smoke passes |

This proves the merge-to-production webhook path and a safe repeat of the
migration path on the initialized database. Production structured logs were also
read with only method/path/status/duration/request-ID fields; normal version
requests returned 200 and unauthenticated project requests returned 401.

These are historical first-release proofs. Later documentation merges also
trigger new releases; check the current execution and `/api/v1/version` for the
currently running SHA. Do not rebuild or rewrite an old immutable tag merely to
make a document's first-release SHA become current again.

## Demonstration account

The owner explicitly approved the private production account and sample data.
It was created on 27 October 2026 through the normal app API, with one **Harness
Portfolio Project** and seven sample tasks. Hosted verification passed against
commit `afffb73d819c22071a3c2b68a22deeaa7ca4a596`:

- registration and authenticated session identity;
- project/task creation and saved project retrieval after a new login;
- task transitions through IN_PROGRESS to DONE;
- combined status, priority and search filtering;
- dashboard counts of six completed tasks and one open task;
- logout revocation, confirmed by a protected endpoint returning 401.

The generated password stays only in the approved ignored local credential file,
restricted to the current Windows user and SYSTEM. No password/cookie was printed
or committed, no production seed ran, and no existing account's data changed.
The earlier automatic-review block was resolved by this explicit approval.
See [DEMO_GUIDE.md](DEMO_GUIDE.md) for private access and the interview route.

## Follow-up release verification

[Webhook release #11](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/DcxYmreyRX6QieYtJ_zcxw/pipeline)
also succeeded after PR #14 merged, in 8m 9s. Its released commit is
`afffb73d819c22071a3c2b68a22deeaa7ca4a596`; all stages and the final external smoke
passed. Cloud Run revision `devtrack-00003-f7g` was created at
`2026-10-26T10:28:10.351151Z`. Its app digest matches the registry:
`sha256:39bc59e2d26438e0d4bb499478fcfb3971b3a39aa74ad8dcc6c5ac3278ba57b2`.
The migration image digest is
`sha256:446d46b4fdb5f778a95fa86cf30b5573e8fb7e120ad4c95875a731e5c9552d1a`;
execution `devtrack-migrate-4c7x7` succeeded at `2026-10-26T10:27:41.584778Z`.
The public version and hosted workflow checks independently matched that commit.

[Release #12](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/all/orgs/default/projects/DevTrack/pipelines/devtrack_release/executions/tgSryBx3TVSOUWc_LI0A2A/pipeline)
used PR #15's merged commit `4fc615305071d1633b19e0e86116563e8328c033`. Validate
and both image publications succeeded. After native service/artifact setup, the
clean-workspace guard reported `?? dockerconfig` and stopped before migration or
deployment. The app and approved sample data remained on the successful release.
Only the generated file's path was read; credential contents were not inspected.
The correction excludes this exact root registry configuration from Git and
Docker input while preserving the guard. It needs a new reviewed source commit
and new immutable tags, rather than rebuilding or overwriting #12's images.

This completes the previously pending release inspection and production workflow
verification. The corrected source merge creates another automatic release;
its result and retained demo data are checked at handoff rather than starting a cycle of
commits that merely update a document's "latest" SHA.

Keep the small database and app available during the protected trial as requested.
Do not upgrade billing or shut the demo down after its first use. Hosting remains
bounded by trial expiry/credit; preserve code, evidence and a database export.
Learning exercises remain the owner's later independent work.
