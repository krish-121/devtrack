# Implemented API

Base path: `/api/v1`. Successful JSON responses use `{ "data": ... }`.
Failures use `{ "error": { "code": "...", "message": "..." } }`.
Validation failures also include `error.details`, a field-to-message object.

Every API response includes a server-generated `X-Request-ID` UUID. Use it to
match a response to structured API logs. Async application/error logs inherit
the same ID; completion logs include method, path, status and duration, omitting
query strings, cookies, headers and bodies. Client-provided IDs are not trusted.

## Health and build metadata

Public `GET /health` returns `{ "data": { "status": "ok" } }`. It checks process
liveness, not database readiness. Public `GET /version` returns
`{ "data": { "version": "development" } }` locally, or the full lowercase Git
commit SHA baked into a release image. Version responses use `Cache-Control:
no-store` and expose no database URL, account identity or secret. The deployment
smoke requires an exact match to its expected commit, alongside health/frontend
success. Both payloads use schemas from the existing shared contract package.

## Authentication and request boundaries

Project, task, and dashboard routes require a valid session cookie. Missing, malformed,
expired, or revoked sessions return `401 UNAUTHORIZED`. The old development
identity and `DEV_USER_ID` code/configuration have been removed. All project/task
queries are scoped to the session's owner, including mutation queries. Foreign
records and missing records return the same 404 response.

| Method | Path             | Success | Behavior                                             |
| ------ | ---------------- | ------- | ---------------------------------------------------- |
| POST   | `/auth/register` | 201     | Create account and authenticated session             |
| POST   | `/auth/login`    | 200     | Verify credentials and create a fresh session        |
| POST   | `/auth/logout`   | 204     | Revoke current session and expire cookie; idempotent |
| GET    | `/auth/me`       | 200     | Return current user's public DTO                     |

Registration accepts `{ "name": "Your Name", "email": "you@example.com", "password": "a long passphrase" }`.
Name is trimmed and 1–120 characters. Email is trimmed, lowercased, validated,
and limited to 254 characters. Password is 12–128 characters and is not trimmed.
Login accepts email/password, with 1–128 characters for password so existing
credentials are verified rather than reinterpreted by registration policy.
Unknown body fields are rejected. Password confirmation is a browser form check.

Successful register/login/me JSON contains only `{ "data": { "id": "UUID", "name": "...", "email": "..." } }`.
Duplicate registration returns `409 EMAIL_IN_USE`; incorrect login returns a
generic `401 INVALID_CREDENTIALS`. Tokens/hashes never appear in JSON.

The host-only `devtrack_session` cookie is HttpOnly, SameSite=Lax, Path=/,
and Secure in production. A session lasts seven days, checked on every protected
request. Login/register replace the current browser session with a new token;
other devices' sessions are unaffected. Logout deletes the token hash from
PostgreSQL, so replaying its old cookie fails.

Login/register share an in-memory rate limiter: default 20 requests per IP per
15 minutes, configured by `AUTH_RATE_LIMIT_MAX`. Rejection returns 429 with
`RATE_LIMITED` and Retry-After. This limit is per process and resets on restart.
No proxy headers are trusted by default. `TRUST_PROXY_HOPS` accepts a bounded
integer (0–5); deployment must verify it against the real proxy topology so
clients have separate rate-limit buckets and cannot spoof a trusted address.

Mutation requests reject a different `Origin` or cross-site `Sec-Fetch-Site` with
`403 ORIGIN_REJECTED`. POST/PATCH require application/json (`415 JSON_REQUIRED`).
No cross-origin CORS permission is granted. Non-browser clients can omit Origin
but must use JSON. Configure the exact browser origin in `APP_ORIGIN`; production
requires HTTPS. Auth/project/task/dashboard responses send `Cache-Control: no-store`.
Health remains public.

The application image serves built frontend assets from the same Express
process. `/api` is resolved before static/SPA routes, so unknown API endpoints
still return JSON 404s. See [DOCKER.md](DOCKER.md) for frontend routing, caching
and runtime behavior; no new business API endpoint was added in Phases 9/10.

## Project endpoints

| Method | Path                   | Success      | Behavior                                               |
| ------ | ---------------------- | ------------ | ------------------------------------------------------ |
| GET    | `/projects`            | 200          | Owner's projects, newest updated first; ID breaks ties |
| POST   | `/projects`            | 201          | Create project; `Location` header identifies it        |
| GET    | `/projects/:projectId` | 200          | One owner-scoped project                               |
| PATCH  | `/projects/:projectId` | 200          | Update supplied fields only                            |
| DELETE | `/projects/:projectId` | 204, no body | Hard delete project and its tasks                      |

Creation body:

```json
{ "name": "Portfolio", "description": "Explain what I built." }
```

- `name`: required string, trimmed, 1–120 characters after trimming.
- `description`: optional trimmed string, at most 2,000 characters, or `null`.
- PATCH accepts either or both fields, and rejects an empty object.
- Omitted description preserves its value on PATCH; `null` clears it.
- Unknown fields, including `ownerId`, are rejected.
- Project IDs must be UUIDs.
- JSON bodies are limited to 16 KB. Malformed JSON returns `400 INVALID_JSON`;
  oversized bodies return `413 PAYLOAD_TOO_LARGE`.

One-project response (list responses contain an array of these DTOs):

```json
{
  "data": {
    "id": "22222222-2222-4222-8222-222222222222",
    "name": "Harness Project",
    "description": "Learn how code moves through a delivery pipeline.",
    "createdAt": "2026-10-11T00:00:00.000Z",
    "updatedAt": "2026-10-11T00:00:00.000Z",
    "taskCount": 3,
    "completedTaskCount": 1,
    "progress": 33
  }
}
```

Dates above are illustrative. Actual dates come from PostgreSQL and are serialized
as UTC ISO strings. DTOs omit owner internals and database-only fields. Counts
come from one grouped task aggregate, so total/completed counts use the same
database snapshot. Progress is rounded to a whole percentage; zero tasks means
zero percent. Task mutations also update the parent project's activity date.

Known errors use the shared format. Unexpected failures are logged by Pino and
return a generic `500 INTERNAL_SERVER_ERROR` without internal error details.

## Example local requests

After starting the database and API, register/login first. Use your own local
test credentials rather than a password stored in a source file:

```powershell
$credentials = @{ email = 'you@example.com'; password = (Read-Host 'Password' -MaskInput) } | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/v1/auth/login `
  -Method Post -ContentType 'application/json' -Body $credentials -SessionVariable session

Invoke-RestMethod http://localhost:3000/api/v1/projects -WebSession $session

$project = Invoke-RestMethod http://localhost:3000/api/v1/projects `
  -Method Post -ContentType 'application/json' `
  -Body '{"name":"Learning REST","description":"Trace one request."}' -WebSession $session

Invoke-RestMethod "http://localhost:3000/api/v1/projects/$($project.data.id)" -WebSession $session
```

In the browser, the shared HTTP client sends same-origin `/api/v1` requests.
Vite proxies those requests to the API during development. Cookies are included
by the client. Browser JavaScript never reads the HttpOnly authentication cookie.

## Task endpoints

| Method | Path                         | Success | Behavior                                         |
| ------ | ---------------------------- | ------- | ------------------------------------------------ |
| GET    | `/projects/:projectId/tasks` | 200     | List owned project's tasks with optional filters |
| POST   | `/projects/:projectId/tasks` | 201     | Create task; Location header identifies it       |
| GET    | `/tasks/:taskId`             | 200     | Read owned task                                  |
| PATCH  | `/tasks/:taskId`             | 200     | Update supplied fields only                      |
| DELETE | `/tasks/:taskId`             | 204     | Permanently delete owned task                    |

Task creation accepts:

```json
{
  "title": "Trace task creation",
  "description": "Follow the request into the repository.",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-10-30T00:00:00.000Z"
}
```

Title is required, trimmed, and 1–200 characters. Description is optional,
trimmed, at most 5,000 characters, or null. Status is TODO/IN_PROGRESS/DONE;
priority is LOW/MEDIUM/HIGH. Defaults are TODO/MEDIUM. Due date is optional, null,
or a valid ISO timestamp with timezone. Responses normalize dates to UTC.
The browser's date picker stores a calendar date at midnight UTC and displays it
in UTC so the chosen day does not shift with local timezone.

PATCH uses the same rules, requires at least one field, and preserves omitted
fields; null clears description/dueDate. Neither endpoint accepts projectId,
ownerId, IDs, or timestamp overrides in the body. Task IDs must be UUIDs.

Task DTOs contain id, projectId, title, description, status, priority, dueDate,
createdAt, and updatedAt. Responses use the same data envelope as projects.

Example filters:
`GET /api/v1/projects/:projectId/tasks?status=IN_PROGRESS&priority=HIGH&q=harness`.
Filters combine with AND; text matches title OR description, case-insensitively.
Search is literal (SQL wildcard characters are escaped), trimmed, and limited to
200 characters. Invalid enums, repeated query values, or unknown filter fields
return 400. All filtering runs in PostgreSQL. Ordering is createdAt ascending,
then ID. A missing/foreign parent returns 404 rather than an empty task list.

## Dashboard summary

`GET /api/v1/dashboard/summary` returns 200 with one authenticated summary.
It accepts no owner selector or filter; identity comes exclusively from the
session. Unrecognized query fields are ignored and cannot override ownership.

```json
{
  "data": {
    "activeProjectCount": 1,
    "openTaskCount": 2,
    "completedTaskCount": 1,
    "tasksByStatus": { "TODO": 1, "IN_PROGRESS": 1, "DONE": 1 },
    "recentProjects": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "name": "Harness Project",
        "description": "Learn how code moves through a delivery pipeline.",
        "createdAt": "2026-10-11T00:00:00.000Z",
        "updatedAt": "2026-10-24T00:00:00.000Z",
        "taskCount": 3,
        "completedTaskCount": 1,
        "progress": 33
      }
    ]
  }
}
```

- **Active projects** means all currently stored projects owned by this account.
  V1 uses hard deletion and has no archived/inactive project state.
- **Open tasks** is TODO + IN_PROGRESS across all owned projects. **Completed
  tasks** is DONE. Every status key is present, including zero counts.
- **Recent projects** contains at most five, ordered by updatedAt descending,
  then ID ascending for deterministic ties. Counts include tasks in older projects
  too. Task mutations update the parent project's activity date.
- Recent items reuse the project DTO and progress calculation. Projects with no
  tasks have zero progress. A new account has zero counts and an empty array.
- The repository runs a fixed set of four aggregate/recent-project queries in a
  PostgreSQL Repeatable Read transaction. All cards/progress describe one snapshot,
  without loading every task or issuing a query per project.

The browser validates this contract with the shared Zod schema, queries the one
endpoint, and invalidates its cached summary after successful project/task
creation, update, or deletion. It does not calculate cross-project totals from
separate project/task HTTP requests.
