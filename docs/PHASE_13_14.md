# Phase 13/14 release evidence

Updated 26 October 2026. **Phase 13 artifact publishing is verified. Phase 14
live deployment is still pending.** No Cloud Run service or migration job existed
at the current Google CLI check. The small database remains RUNNABLE. There has
been no paid billing upgrade.

The owner signed back in and release #7 proved the generated-workspace fix.
Its migration action then failed before job creation because the native template
did not supply its Google project. Release #8 proved the explicit project binding,
then exposed job-name precedence over the manifest. Manifest-only mode has now
passed an offline vendor-plugin probe and awaits real execution. Do not substitute
a manual deployment and describe it as Harness CD.

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration and trial operation,
[HARNESS.md](HARNESS.md) for every stage/resource, and
[DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) for the observed problems and choices.

## What is verified

- GitHub PRs #1 through #9 merged normally after required exact-head Harness
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
- The last deployment guard stopped on generated `cloud_run/` output. PR #9 now
  ignores that exact root folder while retaining tracked-source/current-main checks.
- Local real-database, browser and Docker checks pass, including fresh and repeated
  Unix-socket migrations, image version guards and production container security.

## Traceable artifact proof

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

No failing run migrated production or created a Cloud Run app/job. Preserve audit
records rather than deleting failed executions or rewriting image tags.

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
5. **Workspace:** root `/cloud_run/` is generated by Harness. Exclude only it from
   Git/Docker input. Maintained `infrastructure/cloud-run/` remains tracked.

## Checks and changes

The final application change adds request-ID correlation described by spec
sections 44/45: generated `X-Request-ID`, async Pino context and completion logs
with method/path/status/duration. Query strings, credentials and request payloads
are omitted. No business behavior, API JSON shape or schema changed.

**126 unique tests:** 49 API unit + 47 real database/API integration + 28 frontend

- two Chromium workflows. Coverage and Docker rerun existing tests; they are not
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

The official Harness v1 pipeline and trigger schema checks passed. Real execution
was still necessary: the native argument, authentication and image-format issues
were not detectable from schema validation alone.

## Remaining live verification

1. Run the corrected current protected-main commit with matching clone and
   `release_commit`, explicit native project inputs, enablement true and preflight on.
2. Verify the generated-workspace guard passes and the one-time migration job
   completes before deploying the same published application artifact.
3. Configure service-scoped public invocation for the interview app, leaving
   application authentication and database access controls enabled.
4. Verify the actual Cloud Run URL/revision/digest, external HTTPS health, exact
   baked version, frontend and database-backed behavior. Record the results here.
5. Enable the real main-push trigger only after manual success, then prove a main
   update executes the same release path. Saved trigger YAML alone is insufficient.
6. Prepare the demonstration account through normal application workflows; never
   seed production. See [DEMO_GUIDE.md](DEMO_GUIDE.md).

Keep the small database and app available during the protected trial as requested.
Do not upgrade billing or shut the demo down after its first use. Hosting remains
bounded by trial expiry/credit; preserve code, evidence and a database export.
Learning exercises remain the owner's later independent work.
