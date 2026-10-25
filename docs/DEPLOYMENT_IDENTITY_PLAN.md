# DevTrack trial identity approval plan

Target: only `devtrack-trial-krish-20261024` (project number `656038155261`).
Billing stays on the verified protected Free Trial. This plan grants no billing,
organization, project Owner, or unrelated project permissions.

| Identity                                                                 | Purpose and permission scope                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `harness-release@devtrack-trial-krish-20261024.iam.gserviceaccount.com`  | Publish images with Artifact Registry Writer on the `us-central1/devtrack` repository; create/update/run DevTrack Cloud Run services/jobs with Cloud Run Developer in this isolated project; read deployment metrics with Monitoring Viewer; act as only `devtrack-runtime` using Service Account User on that identity. |
| `devtrack-runtime@devtrack-trial-krish-20261024.iam.gserviceaccount.com` | Connect to the project's Cloud SQL database with Cloud SQL Client; read only the `production_database_url` secret with Secret Accessor. Used by the app and one-off migration job.                                                                                                                                       |

Create a Workload Identity pool `harness` and OIDC provider `harness`, in this
project's global location. Trust issuer:

```text
https://app.harness.io/ng/api/oidc/account/mtlwn9WUSnWeBUymA4te_Q
```

Map `google.subject=assertion.sub` and
`attribute.account_id=assertion.account_id`. Require
`assertion.account_id == 'mtlwn9WUSnWeBUymA4te_Q'`.
Grant Workload Identity User on only `harness-release` to the pool's principal
set with that exact account attribute. Google then exchanges signed Harness
identity tokens for short-lived release credentials; no JSON private key is
created. The GCP connector will be scoped to the Harness `DevTrack` project.

This trust permits authorized workloads in that Harness account to assume the
release identity. Keep the connector and release pipeline access restricted;
ordinary PR validation does not use it. Deployment authority can run code as the
runtime identity and therefore access this project's database credential. It
does not grant access to other projects or the Google account's billing.

Public web access is not included in this IAM operation. A service-scoped public
invoker decision will be reviewed separately when the deployed app exists.
No broad database IP allowlist, service-account key, paid upgrade, or permanent
production hosting is part of this plan.

Status: explicitly approved by the user on 24 October 2026. The two service
accounts, restricted OIDC provider, federation binding, repository writer,
Cloud Run/monitoring roles, runtime impersonation and Cloud SQL Client bindings
have been created. Secret Accessor is granted only on `production_database_url`
to the runtime identity; version `1` is enabled. The initial automatic-review rejection was resolved with explicit
approval; that rejected command itself did not create resources.

## Approved CD compatibility fallback

The real release on 25 October reached native CD artifact initialization, where
`harnessdev/gar-artifact-metadata:0.0.1` failed Google's token exchange with
`invalid_grant: Unable to parse the ID Token`. The same approved OIDC connector
successfully published both images in CI. Adding IAM roles would not correct
this token parsing failure. No supported project-level version override was
found in the available native CD settings.

The owner approved creating one JSON key for the existing `harness-release`
identity and use it only in a separate, project-scoped Harness `gcp_cd`
connector. Keep the existing `gcp` OIDC connector for CI. The CD connector may
perform only the already approved release identity's operations in this trial
project; do not add roles, billing access, database permissions or other projects.
Store the credential in Harness's managed secret storage and a restricted, ignored local
recovery folder. Never commit it, print it, place it in a Run step, or include it
in screenshots. The owner must complete credential upload in the connector UI.

A key is a reusable credential rather than a short-lived token. Revoke it when
the trial/demo is retired or when a verified native OIDC fix replaces it. Keep
the app running during the trial as requested. Creating this compatibility
connector does not upgrade billing or create a paid resource. One key was
created on 25 October 2026 in the restricted local recovery folder; its contents
were not printed. Owner upload, connector testing and live CD execution remain
pending. Approval and key creation do not prove that deployment has passed.
