# GitHub workflow

Use a short-lived `feature/...`, `fix/...`, or `ci/...` branch. Keep `main`
ready to release. A pull request validates changes; merging and deployment are
separate decisions.

```sh
git switch main
git pull --ff-only
git switch -c feature/describe-the-change
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
git add <reviewed-files>
git diff --cached
git commit -m "feat: describe the resulting behavior"
git push -u origin feature/describe-the-change
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

The required Harness status context must be selected from an actual completed
run before enabling branch protection. Do not invent a check name: a required
check that is never reported would prevent every merge. Do not bypass failing
checks or merge the bootstrap PR merely to finish this exercise.
