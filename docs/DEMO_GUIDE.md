# Demonstrating DevTrack

Use this with [WALKTHROUGH.md](WALKTHROUGH.md), the current live evidence in
[PHASE_13_14.md](PHASE_13_14.md), and [DEPLOYMENT.md](DEPLOYMENT.md). Verify the app
before an interview; protected trial hosting has an end date and cold starts.

## Prepare once

Create your own account through normal registration. Keep its password private;
the development seed intentionally provides no usable login and must never run
in production. Create a project named **Harness Portfolio Project** with tasks:

| Task                                      | Suggested state                | What it helps explain                         |
| ----------------------------------------- | ------------------------------ | --------------------------------------------- |
| Validate a PR with Harness                | DONE                           | Required status checks and failure proof      |
| Review PostgreSQL relationships           | DONE                           | Ownership, foreign keys and transactions      |
| Test authentication and task workflows    | DONE                           | Layered tests and isolated data               |
| Build the commit-tagged Docker image      | DONE                           | Runtime vs migration image, immutable tag     |
| Deploy and verify the same artifact       | Use the verified release state | Migration, Cloud Run and external smoke check |
| Practise explaining the request lifecycle | TODO                           | Your remaining independent learning work      |

Use sample text only; no real employer, medical or other sensitive data. Keep
this account for your demonstrations. An interviewer can register a separate
account and sees only their own data. There is no shared public demo password.

## Five-minute route

1. **App:** Log in, show real dashboard counts, open the prepared project, create
   or update a sample task, filter it and show refreshed progress.
2. **Code:** Trace that operation using WALKTHROUGH and the actual service/repository.
   Explain why changing a UUID cannot access another owner's task.
3. **GitHub:** Open a merged PR, its reviewed diff, required Harness check and commit.
4. **Harness CI:** Show one successful validation and the documented deliberate
   failure. Explain that a failure blocks merging.
5. **Artifact:** Show the full-SHA tag and registry digest. Explain that the tag,
   baked `/api/v1/version` value and released commit must agree.
6. **Harness CD:** Show the real successful release, migration-before-deploy order,
   and external smoke step. Do not open secret values or unmask logs.
7. **Live app:** Refresh it and show `/api/v1/version` for the deployed commit.

Do not trigger a fresh cloud release during an interview merely for display.
Use completed execution evidence. A small task change is enough to demonstrate
the running application.

## Before each interview

- Open the URL early; a scale-to-zero app may need a cold start.
- Check health/version and log in with your private account.
- Confirm the trial is active and unupgraded; check the remaining days/credit.
- Keep a short screen recording/screenshots and a locally runnable checkout as
  fallback if a network, cloud service or trial expiry interrupts access.
- Explain known limits honestly: single region, one app instance, small database,
  no uptime guarantee and no claim of large-scale production traffic.

The repository and deployment evidence remain useful after hosting stops. Do not
describe a stopped service as currently live. Do not upgrade billing just to keep
a CV link working; choose a new hosting plan only after an explicit later decision.
