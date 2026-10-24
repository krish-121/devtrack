# Phases 11 and 12: GitHub workflow and Harness PR validation

Verified on 24 October 2026 against `PROJECT_SPEC.md`, sections 67–83 and 134.
Phases 1–10 were already implemented. These two phases add the repository
workflow and real pull-request CI; application architecture and V1 scope stay
unchanged. Phase 13 artifact publishing and deployment have not been started.

## Delivered

- Branch `ci/harness-pr-validation` and an open, unmerged
  [PR #1](https://github.com/krish-121/devtrack/pull/1) into `main`.
- A PR template, documented branch/review workflow, and LF source-file policy.
- Harness project `DevTrack` in organization `default`, with project-scoped
  GitHub connector `github` filtered to `krish-121/devtrack`.
- Saved `devtrack-pr-validation` pipeline (`devtrack_pr_validation`) on Harness
  Cloud Linux amd64. It reuses existing npm checks and disposable PostgreSQL.
- Enabled PR trigger `devtrack_pull_requests`: Open, Reopen, Synchronize;
  target branch equals `main`; superseded executions are aborted. The triggering
  PR number supplies the checkout reference using the v1 input overlay.
- `main` protection requires a PR, an up-to-date branch, resolved conversations,
  and actual status context `devtrack_pr_validation-Validate`, including for
  admins. Force pushes/deletion are disabled. Review approvals are not mandatory
  for this solo repository; owner review and merging remain manual.

There is one CI system: Harness. The PR job does not publish images or deploy.
Its connection reads the repository, creates the PR webhook, and writes commit
statuses. The account owner completed GitHub OAuth; project connector resource
filters are separate from that GitHub authorization. No token or production
credential is stored in Git or supplied to the PR commands.

## Real failure and fix

| Proof                 | Commit                                     | Observed result                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deliberate type error | `7d67b0200961ddfe30941e004b1f6adf49c47b2d` | [Harness execution #2 failed](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/ci/orgs/default/projects/DevTrack/pipelines/devtrack_pr_validation/executions/LnUjnufHRTKbGoJt1-wGDg/pipeline) at Strict TypeScript; GitHub reported failure on this SHA |
| Error removed         | `3f4c44ef0f5100942e9504e88247f252f0458dbc` | [Harness execution #3 passed](https://app.harness.io/ng/account/mtlwn9WUSnWeBUymA4te_Q/ci/orgs/default/projects/DevTrack/pipelines/devtrack_pr_validation/executions/IxNRyBhATuSH8JnlW0d2PA/pipeline); GitHub reported success on this SHA                      |

The failing file temporarily assigned a string to an exported `number` in
`apps/api/src/ci-typecheck-proof.ts`. Harness installed dependencies and passed
format/schema/lint checks, then reported:

```text
src/ci-typecheck-proof.ts(2,14): error TS2322:
Type 'string' is not assignable to type 'number'.
```

Subsequent checks were skipped after that failure. The fix removed the entire
temporary file; no intentional type error remains. Permanent application tests
were neither added nor weakened for this exercise. Documentation/configuration
follow-ups also trigger the required check: always inspect the latest PR SHA.

## Files and decisions

Created for these phases:

- `.gitattributes`: consistent LF source checkout for Windows/Linux.
- `.github/pull_request_template.md`: change, reason, validation, database and
  delivery impact, and review notes.
- `infrastructure/harness/pipelines/devtrack-pr-validation.yaml`: versioned
  install, format/schema/lint, types, unit/frontend tests, PostgreSQL integration,
  coverage gates, and production build.
- `infrastructure/harness/triggers/devtrack-pr-validation.yaml`: versioned PR
  webhook and runtime clone input overlay.
- `infrastructure/harness/scripts/setup-node.sh`: exact Node/npm from `.nvmrc`
  and `packageManager`, official archive SHA-256 verification, local CI toolchain,
  and Docker/Compose availability checks.
- `docs/GITHUB_WORKFLOW.md`, `docs/HARNESS.md`, and this report.

Modified `.gitignore`, `.prettierignore`, `eslint.config.js`, and `.dockerignore`
to exclude `.ci/` downloads; updated `README.md` and `docs/PROJECT_PROGRESS.md`.
No new dependencies, application clients, database migrations, product features,
or production services were introduced by Phases 11/12.

The application files from Phases 1–10 had never been committed. Bootstrap
commits import them by responsibility instead of inventing historical dates:
`1831fb7` workspace/database, `f03da48` backend, `1d70fd0` frontend, and `3929b74`
testing/Docker/documentation. The initial PR is consequently larger than future
feature PRs should be. The spec and AGENTS instructions were preserved.

Git remains the pipeline source of truth. The same YAML is applied to an inline
Harness pipeline because its Git-storage branch picker did not expose the
pushed CI branch. The account's editor requires v1 YAML. Its backend rejected
the optional top-level version marker; omitting that marker produced a valid,
saved pipeline. The official v1 JSON schema and trigger schema both validate
the committed definitions. See [HARNESS.md](HARNESS.md) for the actual field
layout, input overlay, and update procedure.

Each database step traps EXIT and stops only the test service even if tests
fail. The existing runner applies migrations to `devtrack_test` on loopback 5433. It does not use the developer's `.env` database. The ephemeral Cloud VM
provides Docker Compose; no new test database configuration or Kubernetes is
needed. Cloud checkout and setup were verified by real executions.

## Checks executed

| Command/check                                                              | Result                                                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Prettier on affected Markdown/YAML/JS; `npm run format:check`              | Pass                                                                                                     |
| `npm run db:validate`                                                      | Pass                                                                                                     |
| `npm run lint`                                                             | Pass, zero warnings                                                                                      |
| `npm run typecheck`                                                        | Pass before the deliberate proof; Harness passes after removal                                           |
| `npm test`                                                                 | 39 API unit and 28 frontend tests pass                                                                   |
| `npm run test:integration`                                                 | 46 tests pass against real disposable PostgreSQL                                                         |
| `npm run test:coverage`                                                    | 85 combined backend + 28 frontend pass; API lines 98.56%, frontend lines 94.01%; all gates pass          |
| `npm run build`                                                            | Pass; production frontend JS 416.85 kB                                                                   |
| `npm run test:e2e`                                                         | Both Chromium workflows pass                                                                             |
| `npm run test:docker`                                                      | Image build, both Chromium workflows, production health/SPA/API/port/non-root/HTTPS/shutdown checks pass |
| `sh -n setup-node.sh` in official Linux Node image                         | Pass                                                                                                     |
| Temporary Ajv CLI against official Harness v1 pipeline and trigger schemas | Pass; no application dependency added                                                                    |
| Git diff whitespace/secret/ignored-output review                           | Pass; no credentials or generated outputs committed                                                      |
| GitHub webhook → Harness failure → fix → success                           | Verified on actual PR commits above                                                                      |

There are **115 unique application tests**: 39 unit + 46 integration + 28
frontend + 2 E2E. Coverage and Docker runs intentionally repeat relevant tests.
The disposable integration and browser databases were stopped afterward;
development data was preserved.

Initial local test execution hit Windows sandbox temporary-file ENOENT errors;
the same tests passed with normal temporary-file access. Docker Desktop was
initially stopped; starting its existing installation resolved database checks.
An attempted generic validation of Harness's older v0 pipeline schema failed
on an unrelated empty schema enum. The account uses v1; the final v1 schema
validation and actual pipeline executions pass. These were environment/tooling
issues, not suppressed application failures. No product errors remain from this
change. The PR remains open for review; it was not merged.

## Learning checks

1. Trace `git push` → GitHub PR synchronize webhook → trigger PR number → clone
   → seven check steps → commit status → required-check merge protection.
2. Explain why the green result must belong to the latest commit, and why the
   deliberate TS2322 failed before tests/build could run.
3. Find the connector, clone input, Cloud runtime, and npm commands in the YAML.
   Distinguish pipeline definition storage from the PR code being tested.
4. Explain the difference between unit, database integration, browser E2E, and
   production-image checks, and how database isolation protects local data.
5. Explain why a passing PR does not publish an artifact or deploy the app.

Suggested commit message: `ci: add Harness pull request validation workflow`.
