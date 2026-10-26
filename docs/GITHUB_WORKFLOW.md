# GitHub workflow

Use a short-lived `codex/...` branch for agent work (or a descriptive branch for
your own practice). Keep `main`
ready to release. A pull request validates changes; merging and deployment are
separate decisions.

```sh
git switch main
git pull --ff-only
git switch -c codex/describe-the-change
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
git add <reviewed-files>
git diff --cached
git commit -m "feat: describe the resulting behavior"
git push -u origin codex/describe-the-change
```

Open a pull request into `main` using `.github/pull_request_template.md`.
Explain what changed, why, validation, and database/pipeline impact. Include
screenshots for visible UI changes. Review the diff and wait for the latest
commit's Harness validation before merging. A previous green commit does not
validate later changes. Run coverage and the two browser workflows when their
behavior is affected; see [TESTING.md](TESTING.md).

Use small commits with a clear purpose. Never stage `.env`, credentials,
generated Prisma code, dependencies, build outputs, coverage, or CI downloads.
`.gitignore` excludes these, and `.gitattributes` keeps source files on LF across
Windows and Linux. Read the staged diff before every commit.

The Phase 11 bootstrap PR also imports the already implemented Phases 1–10.
Those files were present locally but had never been committed. They are grouped
by responsibility without inventing earlier development history. Future PRs
should contain only the current change.

`main` requires a PR, an up-to-date branch, and the observed Harness status
`devtrack_pr_validation-Validate`. These rules also apply to administrators.
Force pushes and branch deletion are disabled, and conversations must be
resolved. A required approval count of zero supports this solo learning repo;
the owner explicitly authorized the agent to review and automatically merge
project PRs after required checks pass on 25 October 2026. This overrides the
original manual owner-inspection gate, not GitHub protection. Do not bypass
failed checks. See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md).

The bootstrap PR is [#1](https://github.com/krish-121/devtrack/pull/1). See the
[Phase 11/12 report](PHASE_11_12.md) for the real failing and passing CI runs.
