# Harness PR validation

Release publishing/deployment is documented separately in
[DEPLOYMENT.md](DEPLOYMENT.md). Its versioned YAML is prepared, with execution
disabled pending reviewed main and live release verification. The project-scoped
keyless GCP connector passes its connection test; service `devtrack`, environment
`production` and infrastructure `cloud_run` exist. The release pipeline has not
been executed yet; its reviewed YAML is installed with releases disabled by
default. The PR pipeline below remains
non-deploying and does not receive production secrets.

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

## References

- [Harness native Run step settings](https://developer.harness.io/docs/continuous-integration/use-ci/run-step-settings/)
- [Harness input sets and PR trigger examples](https://developer.harness.io/docs/platform/pipelines/input-sets)
- [Harness v1 pipeline schema](https://github.com/harness/harness-schema/blob/main/v1/pipeline.json)
