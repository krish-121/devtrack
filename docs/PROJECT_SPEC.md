Yep. If you’re handing this directly to an AI coding agent and you want the result to become a real CV project rather than a pile of generated code, I would give it a real engineering specification.

I would make one important distinction:

AI can write a large percentage of the implementation. It cannot substitute for understanding the architecture.

The project should therefore be designed so that:

* every major subsystem has a clear reason to exist
* every folder has a clear responsibility
* every dependency direction can be explained
* every important workflow can be traced from UI → API → database → response
* the Harness pipeline can be explained from Git push → validation → artifact → deployment
* generated code remains readable enough that the person building the project can modify it without asking AI to regenerate the entire system

The code should look like it was produced by a disciplined engineering team.

It should NOT look like:

“AI generated enough files until the application happened to work.”

Below is the version I would actually send.

DevTrack

Full-Stack Project & Task Management Platform with Production-Style CI/CD using Harness

1. Project Vision

Build a polished project and task management web application that is intentionally moderate in application complexity but strong in software-engineering quality.

The product itself should allow a user to:

* register and log in
* create projects
* edit and archive/delete projects
* create tasks inside projects
* update task status
* assign task priority
* add optional due dates
* search tasks
* filter tasks
* view a useful dashboard
* view project progress
* safely log out

The engineering system around the product should demonstrate:

* React frontend development
* TypeScript
* Node.js backend development
* REST APIs
* PostgreSQL
* authentication
* validation
* testing
* Docker
* Git
* GitHub
* CI
* CD
* Harness pipelines
* Harness secrets
* build artifacts
* deployment environments
* cloud deployment
* logging
* documentation
* clean architecture without unnecessary enterprise complexity

The objective is NOT to create the most complicated task manager possible.

The objective is:

Build a project that is simple enough to completely understand, but engineered well enough that it demonstrates how a real software application is developed, tested, packaged, and delivered.

The final project should be something the developer can confidently explain in an interview from end to end.

⸻

2. The Core Problem

A weak student full-stack project often looks like:

React
   ↓
random API routes
   ↓
database
   ↓
deployed somewhere

and the code becomes:

components/
utils/
helpers/
misc/
final/
final2/
api-old/
api-new/

This creates several problems.

Problem 1 — Code works but has no architecture

A feature might technically work while its logic is spread across:

* route files
* React components
* database queries
* utility files
* random middleware
* copied helper functions

The developer cannot explain where business logic belongs.

Problem 2 — Frontend and backend responsibilities become mixed

For example:

The frontend should decide:

“What does the user want to do?”

The backend should decide:

“Is the user allowed to do it, is the request valid, and how should the data change?”

Do not place important authorization or business rules only in the browser.

Problem 3 — Generated code becomes difficult to edit

AI frequently solves the immediate prompt rather than preserving the long-term architecture.

A simple request such as:

“Add task priority filtering.”

can accidentally create:

* a second API client
* duplicated task types
* another validation system
* a new state pattern
* inconsistent naming
* database access inside a controller
* duplicated CSS

This project must prevent that.

Problem 4 — The application is treated as the entire project

A serious engineering project also includes:

* version control
* automated checks
* repeatable builds
* deployment
* secrets
* logs
* documentation
* failure handling

Problem 5 — CI/CD becomes decorative

Do not create a Harness pipeline that only prints:

echo "Hello world"

The Harness pipeline must actually validate and deliver the application.

Problem 6 — AI creates code the developer cannot explain

The project fails its learning objective if the developer can only say:

“Claude/ChatGPT wrote this.”

The final developer should be able to trace:

Create Task button
       ↓
React event
       ↓
API request
       ↓
Express route
       ↓
validation
       ↓
service
       ↓
repository
       ↓
PostgreSQL
       ↓
API response
       ↓
React query refresh
       ↓
updated UI

and also:

git push
   ↓
GitHub
   ↓
Harness trigger
   ↓
CI Build stage
   ↓
lint
   ↓
type check
   ↓
tests
   ↓
application build
   ↓
Docker image
   ↓
artifact registry
   ↓
deployment
   ↓
smoke check

Those two flows are the educational center of the project.

⸻

3. Product Philosophy

The project follows this principle:

Simple product.
Strong engineering.
Understandable code.
Real delivery pipeline.

Do not confuse engineering quality with engineering complexity.

Good engineering here means:

* predictable file placement
* explicit boundaries
* readable names
* small focused functions
* consistent error handling
* consistent API shapes
* typed data
* validated inputs
* tests around important behavior
* repeatable local setup
* repeatable deployment
* clear documentation

It does NOT mean:

* 25 design patterns
* seven microservices
* custom dependency injection framework
* event sourcing
* Kafka
* Kubernetes
* service mesh
* Redis without a reason
* abstract interfaces for every three-line function

The system should be boring in the best possible way.

A new developer should be able to open the repository and understand where a new feature belongs.

⸻

4. Target User

Primary user:

An individual developer/student who wants to organize personal software projects and tasks.

Initial product scope is deliberately single-user-per-account.

A user owns projects.

A project owns tasks.

Do NOT begin with:

* organizations
* workspaces
* teams
* invitations
* role hierarchies
* billing
* enterprise permissions

Those features add large amounts of complexity without improving the main learning objective.

Primary workflow:

User
  ↓
logs in
  ↓
opens dashboard
  ↓
creates project
  ↓
creates tasks
  ↓
moves tasks through statuses
  ↓
filters/searches work
  ↓
tracks project progress

⸻

5. Why This Product

The application domain is intentionally familiar.

A task manager does not require difficult algorithms before useful engineering can begin.

That leaves room to learn:

* frontend architecture
* backend architecture
* API design
* database design
* authentication
* testing
* Docker
* CI/CD
* Harness
* deployment

The product should therefore NOT attempt to impress through feature count.

The engineering process is the differentiator.

⸻

6. Product Name

Working name:

DevTrack

Subtitle:

Project & Task Management Platform

Possible repository name:

devtrack

Possible production name:

DevTrack

Do not waste time building a brand system.

A clean wordmark is enough.

⸻

7. High-Level Product Experience

The application should feel similar in cleanliness to a modern developer tool.

Not a clone of Jira.

Not a clone of Linear.

Not a clone of Trello.

Use familiar interaction patterns without copying another product pixel-for-pixel.

Primary navigation:

DevTrack
├── Dashboard
├── Projects
└── Account menu

The main experience should be:

Dashboard
   ↓
Project
   ↓
Task board/list
   ↓
Create or edit task

The product must be usable without reading instructions.

⸻

8. Main Screens

Screen 1 — Login

Elements:

* DevTrack logo/text
* email input
* password input
* Log In button
* link to Register
* inline validation
* clear server error message
* loading state

Do not put a giant marketing landing page in V1.

⸻

Screen 2 — Register

Elements:

* name
* email
* password
* confirm password
* Create Account button
* link to Login

Show password requirements clearly.

Do not silently reject a password after submission if the requirement could have been explained beforehand.

⸻

Screen 3 — Dashboard

The dashboard should show useful data, not decorative numbers.

Example:

DEVTRACK

Good evening

┌──────────────────┐
│ Active Projects  │
│        4         │
└──────────────────┘

┌──────────────────┐
│ Open Tasks       │
│       13         │
└──────────────────┘

┌──────────────────┐
│ Completed Tasks  │
│       27         │
└──────────────────┘

Task Status
Todo          6
In Progress   7
Done         27

Recent Projects

Project           Progress
Harness Project   72%
Portfolio         45%
College App       90%

Dashboard data must come from real stored data.

No hardcoded fake analytics after V1 is complete.

⸻

Screen 4 — Projects

Show project cards or a clean table.

Each project should show:

* project name
* short description
* task count
* completed task count
* progress percentage
* updated date

Actions:

* Open
* Edit
* Delete/Archive

The UI should not expose destructive actions as giant primary buttons.

⸻

Screen 5 — Project Detail

This is the core product screen.

Header:

Project name
Description
Progress
Edit Project
New Task

Then:

Search [________________]

Status [All ▼]
Priority [All ▼]

Board:

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ TODO            │ │ IN PROGRESS     │ │ DONE            │
│                 │ │                 │ │                 │
│ Task A          │ │ Task C          │ │ Task F          │
│ High            │ │ Medium          │ │ Low             │
│ Due Oct 12      │ │                 │ │                 │
│                 │ │                 │ │                 │
│ Task B          │ │ Task D          │ │ Task G          │
└─────────────────┘ └─────────────────┘ └─────────────────┘

Drag-and-drop is OPTIONAL.

V1 can use an explicit status selector.

That is easier to implement, easier to test, and easier to understand.

⸻

Screen 6 — Task Form

Fields:

* title
* description
* status
* priority
* due date

Actions:

* Save
* Cancel
* Delete when editing

Validation should exist both:

* in the frontend for user experience
* in the backend for correctness/security

Frontend validation must never be the only validation.

⸻

9. UI Design Rules

The UI should look professional through consistency, not visual effects.

Prioritize:

* clear typography
* consistent spacing
* predictable button hierarchy
* readable forms
* responsive layout
* accessible labels
* visible focus states
* loading states
* empty states
* error states
* confirmation for destructive actions

Avoid:

* glassmorphism everywhere
* excessive gradients
* animated backgrounds
* 3D effects
* fake terminal animations
* ten font sizes
* ten button variants
* excessive modals
* animation that delays normal actions

Recommended visual system:

* one sans-serif font stack
* neutral background
* one accent color
* subtle borders
* small border radius
* consistent card padding
* readable maximum content width

The product should look like a tool developers could actually use.

⸻

10. Responsive Behavior

Desktop is the primary demonstration.

But the application should remain usable on mobile.

Desktop:

Sidebar + content.

Tablet:

Narrow sidebar or compact navigation.

Mobile:

Top navigation or collapsible menu.

Project board on mobile can become vertically stacked:

Todo
↓
In Progress
↓
Done

Do not spend weeks perfecting a mobile drag-and-drop board.

⸻

11. Accessibility Baseline

V1 should include:

* semantic buttons
* form labels
* keyboard accessible controls
* visible focus indicators
* sufficient text contrast
* descriptive error messages
* no important action that requires a mouse only

This is not an accessibility certification project.

But basic accessibility is part of professional frontend engineering.

⸻

12. High-Level Architecture

The application architecture should be:

                         ┌──────────────────┐
                         │       User       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   React Web App  │
                         │   TypeScript     │
                         └────────┬─────────┘
                                  │
                               HTTPS
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Express REST API │
                         │   TypeScript     │
                         └────────┬─────────┘
                                  │
                             Prisma ORM
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   PostgreSQL     │
                         └──────────────────┘

Production should remain one logical application.

For V1, prefer a modular monolith.

Meaning:

The frontend and backend are logically separated in the repository, but the backend can serve the built frontend in production so the project can be deployed as one container.

This avoids unnecessary distributed-system complexity.

⸻

13. Why a Modular Monolith

A modular monolith means:

One deployable application
with
well-separated internal modules.

It gives us:

* clear architecture
* simple deployment
* one primary Docker image
* one production URL
* easier authentication
* easier local debugging
* less infrastructure

while still teaching:

* frontend/backend separation
* APIs
* modules
* database boundaries

Do NOT start with microservices.

There is no problem here that requires them.

⸻

14. Technology Stack

Frontend:

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* CSS Modules or a small consistent styling layer

Backend:

* Node.js
* TypeScript
* Express
* Zod
* Prisma
* PostgreSQL
* Pino

Testing:

* Vitest
* React Testing Library
* Supertest
* Playwright for a small number of end-to-end tests

Engineering:

* ESLint
* Prettier
* Docker
* Docker Compose
* Git
* GitHub

Delivery:

* Harness CI
* Harness pipelines
* Harness secrets
* Google Artifact Registry
* Harness CD
* Google Cloud Run

Production database:

* managed PostgreSQL

Local database:

* PostgreSQL through Docker Compose

Do not add another tool unless it solves a defined problem.

⸻

15. Why React

React builds the interactive frontend.

Use it because:

* components teach reusable UI design
* state teaches user-interface behavior
* it is widely used
* it integrates cleanly with TypeScript
* it is large enough to be CV-relevant without requiring a full framework

React is responsible for:

* pages
* forms
* user interactions
* rendering API data
* loading/error states

React is NOT responsible for:

* authorizing database operations
* validating ownership
* storing passwords
* directly talking to PostgreSQL

⸻

16. Why TypeScript

Use TypeScript on both frontend and backend.

This gives one language across the application while teaching:

* static types
* interfaces/types
* function contracts
* API data shapes
* safer refactoring

TypeScript configuration should use strict mode.

Do not disable errors with:

any

unless there is a documented integration reason.

Prefer:

unknown

when a value genuinely has an unknown type.

Then validate/narrow it.

⸻

17. Why Vite

Vite is the frontend build tool.

It provides:

* development server
* fast rebuilds
* production frontend build

Do not introduce Next.js in V1.

Server-side rendering is not needed for this product.

The goal is to learn application engineering, not framework-specific rendering modes.

⸻

18. Why Express

Express is the HTTP backend framework.

It should handle:

* route registration
* middleware
* request/response lifecycle
* API endpoints

Express route handlers should remain thin.

Bad:

route
  ↓
200 lines
  ↓
validation
database queries
authorization
business logic
email
formatting
logging

Better:

route
  ↓
controller
  ↓
service
  ↓
repository
  ↓
database

Each layer should have a reason to exist.

⸻

19. REST API

Use a versioned REST API.

Base:

/api/v1

Authentication:

POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

Projects:

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId

Tasks:

GET    /api/v1/projects/:projectId/tasks
POST   /api/v1/projects/:projectId/tasks
GET    /api/v1/tasks/:taskId
PATCH  /api/v1/tasks/:taskId
DELETE /api/v1/tasks/:taskId

Dashboard:

GET    /api/v1/dashboard/summary

Filtering example:

GET /api/v1/projects/:projectId/tasks?status=TODO&priority=HIGH&q=login

Do not create an endpoint for every tiny UI interaction.

Design around resources.

⸻

20. API Response Shape

Keep responses predictable.

Success example:

{
  "data": {
    "id": "task_123",
    "title": "Build Harness pipeline",
    "status": "IN_PROGRESS"
  }
}

List example:

{
  "data": [
    ...
  ]
}

Error example:

{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found."
  }
}

Validation error:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "title": "Title is required."
    }
  }
}

Do not return five unrelated error formats from different routes.

⸻

21. Data Model

Initial entities:

User
Project
Task

Relationship:

User
  │
  └── owns many Projects
             │
             └── contains many Tasks

User:

User
├── id
├── name
├── email
├── password_hash
├── created_at
└── updated_at

Project:

Project
├── id
├── owner_id
├── name
├── description
├── created_at
└── updated_at

Task:

Task
├── id
├── project_id
├── title
├── description
├── status
├── priority
├── due_date
├── created_at
└── updated_at

Status:

TODO
IN_PROGRESS
DONE

Priority:

LOW
MEDIUM
HIGH

Keep this model intentionally small.

⸻

22. Database Rules

Use PostgreSQL.

Important constraints:

User:

* email must be unique
* email should be normalized before persistence

Project:

* owner_id is required
* project name is required

Task:

* project_id is required
* title is required
* status must use known enum values
* priority must use known enum values

Use foreign keys.

When a project is permanently deleted:

Its tasks may be deleted through a deliberate cascade rule.

Document this choice.

Do not rely only on application code to preserve obvious relational integrity when the database can enforce it.

⸻

23. Prisma

Use Prisma as the application ORM.

ORM means:

Object-Relational Mapper.

Its role is:

Application code
    ↓
typed data access
    ↓
PostgreSQL

Use Prisma because it provides:

* explicit schema
* migrations
* typed queries
* readable data access

But the developer must still learn SQL concepts.

The project documentation should explain:

* tables
* rows
* columns
* primary keys
* foreign keys
* indexes
* unique constraints
* one-to-many relationships
* transactions

Do not let the ORM become a substitute for understanding the database.

⸻

24. Database Migrations

Every schema change should use a migration.

Example:

Need due_date
   ↓
change Prisma schema
   ↓
create migration
   ↓
review generated SQL
   ↓
apply migration

Do NOT manually edit the production database and then try to make the code match later.

Migrations create a history of schema evolution.

Include:

prisma/
├── schema.prisma
└── migrations/

Migration names should describe the change.

Example:

add_task_due_date

not:

update2

⸻

25. Authentication

Authentication answers:

“Who is this user?”

Flow:

email + password
      ↓
validation
      ↓
find user
      ↓
verify password hash
      ↓
create authenticated session/token
      ↓
set secure cookie
      ↓
return user

Use an HttpOnly authentication cookie.

The browser should not need to directly read the authentication token.

Recommended cookie properties in production:

* HttpOnly
* Secure
* SameSite=Lax
* sensible expiration

Because frontend and backend are served from the same application origin, authentication remains simpler.

⸻

26. Password Handling

Never store plain-text passwords.

Flow:

password
   ↓
password hashing function
   ↓
password hash
   ↓
database

At login:

submitted password
   ↓
compare against hash
   ↓
match / no match

Use a reputable password-hashing library.

Never invent custom cryptography.

Never log:

* passwords
* password hashes
* auth tokens

⸻

27. Authorization

Authentication:

“Who are you?”

Authorization:

“Are you allowed to access this?”

Every project query must be scoped to the authenticated owner.

Bad:

SELECT project WHERE id = projectId

Better conceptually:

SELECT project
WHERE id = projectId
AND owner_id = currentUserId

A user must never be able to change an ID in the URL and access another user's project.

Ownership must be enforced in the backend.

Not only hidden in the frontend.

⸻

28. Input Validation

Use Zod at API boundaries.

Examples:

RegisterInput
LoginInput
CreateProjectInput
UpdateProjectInput
CreateTaskInput
UpdateTaskInput
TaskFilterInput

Flow:

HTTP request
    ↓
schema validation
    ↓
typed validated data
    ↓
service

Do not allow unvalidated request bodies to flow deep into the system.

Do not duplicate slightly different validation rules across three files.

⸻

29. Backend Module Architecture

Organize backend code by business feature.

Recommended:

apps/api/src/modules/
├── auth/
├── projects/
├── tasks/
└── dashboard/

Each normal module should follow a consistent pattern.

Example:

tasks/
├── task.routes.ts
├── task.controller.ts
├── task.service.ts
├── task.repository.ts
├── task.schema.ts
├── task.types.ts
└── task.test.ts

Responsibilities:

routes

Connect HTTP path + middleware + controller.

controller

Translate HTTP request into an application call.
Translate result into HTTP response.

service

Contains business rules and use-case logic.

repository

Contains database access.

schema

Contains request validation.

types

Contains feature-specific types when needed.

Do not force every module to contain every file.

A file should exist because it has a responsibility, not because a template demanded it.

⸻

30. Controller Rules

Controllers should be boring.

Example responsibility:

1. read authenticated user
2. read validated input
3. call service
4. return response

A controller should NOT contain:

* Prisma queries
* password hashing
* complicated business rules
* reusable filtering algorithms
* unrelated formatting logic

If a controller becomes large, logic is probably in the wrong place.

⸻

31. Service Rules

Services contain business use cases.

Examples:

createProject()
updateProject()
deleteProject()
createTask()
updateTaskStatus()
getDashboardSummary()

A service may:

* enforce ownership
* enforce business rules
* coordinate repositories
* calculate domain values
* throw known application errors

A service should not know about:

* React
* DOM
* button state
* CSS
* Harness
* HTTP response objects

The service is application logic.

⸻

32. Repository Rules

Repositories contain persistence logic.

Examples:

findProjectByIdForUser()
createProject()
findTasksByProject()
updateTask()
deleteTask()
getTaskStatusCounts()

Repository code should be the main place where Prisma database calls live.

Do not scatter:

prisma.task.findMany()

across controllers, middleware, and utility files.

This creates one obvious place to understand data access.

⸻

33. Error Architecture

Create typed application errors.

Example:

AppError
├── code
├── message
├── statusCode
└── details

Specific helper errors may include:

NotFoundError
UnauthorizedError
ValidationError
ConflictError

An Express error middleware should convert known errors into the standard API error shape.

Unknown errors should:

* return a generic 500 response
* be logged with internal context
* not leak stack traces in production

Do not write try/catch in every controller unless that controller genuinely handles the error.

Centralize unexpected error handling.

⸻

34. Frontend Architecture

Organize frontend code by features and application concerns.

Recommended:

apps/web/src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx
│   └── App.tsx
│
├── pages/
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── DashboardPage/
│   ├── ProjectsPage/
│   └── ProjectDetailPage/
│
├── features/
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   └── dashboard/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── lib/
│   ├── api/
│   ├── query/
│   └── dates/
│
└── styles/

Pages compose features.

Features contain domain-specific UI and hooks.

components/ui contains small reusable generic elements.

Do not put every component into one giant components/ folder.

⸻

35. Frontend Feature Pattern

Example:

features/tasks/
├── api/
│   └── tasks.api.ts
├── components/
│   ├── TaskCard.tsx
│   ├── TaskForm.tsx
│   ├── TaskBoard.tsx
│   └── TaskFilters.tsx
├── hooks/
│   ├── useTasks.ts
│   ├── useCreateTask.ts
│   └── useUpdateTask.ts
└── types/
    └── task.types.ts

Do not create:

taskHelperFinal.ts
taskUtils2.ts
misc.ts

Names should communicate intent.

⸻

36. API Client

Create one shared HTTP client.

Example responsibility:

apiClient.request()

It should handle:

* base API path
* JSON encoding
* credentials/cookies
* normal response parsing
* normal API errors

Feature APIs should build on it.

Example:

tasks.api.ts
  ↓
apiClient
  ↓
/api/v1/...

Do not call fetch() directly from random React components.

Bad:

TaskCard.tsx → fetch(...)

Better:

TaskCard
   ↓
useUpdateTask
   ↓
tasks.api
   ↓
apiClient

⸻

37. Server State

Use TanStack Query for server state.

Server state means data owned by the backend:

* projects
* tasks
* dashboard summary
* current authenticated user

Use it for:

* loading states
* caching
* refetching
* invalidation after mutations

Do NOT put server data into Redux just because Redux exists.

Redux is not required for V1.

Local UI state can stay in React:

* modal open/closed
* current input value
* selected tab

⸻

38. Shared Types

Avoid manually duplicating critical enums and contracts.

Use a small shared package when useful.

Example:

packages/shared/
├── src/
│   ├── task.ts
│   ├── project.ts
│   └── api.ts
└── package.json

Shared code may contain:

* TaskStatus
* TaskPriority
* stable DTO types
* shared Zod schemas when appropriate

Do not put backend database models directly into frontend code.

API contracts are not automatically identical to database models.

⸻

39. Repository Structure

Recommended complete structure:

devtrack/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── pages/
│   │   │   ├── features/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── config/
│       │   ├── modules/
│       │   ├── middleware/
│       │   ├── database/
│       │   ├── errors/
│       │   └── logging/
│       └── package.json
│
├── packages/
│   └── shared/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   └── e2e/
│
├── infrastructure/
│   ├── docker/
│   └── harness/
│       ├── README.md
│       ├── pipelines/
│       ├── triggers/
│       └── input-sets/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── HARNESS.md
│   ├── DESIGN_DECISIONS.md
│   ├── WALKTHROUGH.md
│   └── STUDY_GUIDE.md
│
├── scripts/
│   ├── wait-for-db.ts
│   └── smoke-test.ts
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── package.json
├── tsconfig.base.json
└── README.md

The exact folder structure can change slightly.

The responsibility boundaries should not.

⸻

40. Root Workspace

Use npm workspaces.

Root package.json should provide common commands.

Example commands:

npm run dev
npm run dev:web
npm run dev:api
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run db:migrate
npm run db:seed

The exact scripts may change.

The important principle:

A new developer should not need to remember twelve unrelated commands from different folders for normal work.

⸻

41. Application Startup

Keep app creation separate from process startup.

app.ts

Creates/configures Express application.

server.ts

Starts the HTTP server.

Why?

Tests can import app.ts without opening a real network port.

Concept:

server.ts
   ↓
app.ts
   ↓
routes/middleware

Tests:

test
 ↓
app.ts

This is a small architectural decision that greatly improves testability.

⸻

42. Configuration

All runtime configuration should be centralized.

Example:

apps/api/src/config/env.ts

Configuration:

* NODE_ENV
* PORT
* DATABASE_URL
* AUTH_SECRET
* AUTH_COOKIE_NAME
* LOG_LEVEL

Validate environment variables at startup.

If a required variable is missing:

Fail immediately with a clear message.

Do not allow:

process.env.SOMETHING

to appear in 25 files.

Instead:

env.databaseUrl
env.authSecret
env.port

One validated configuration boundary.

⸻

43. Environment Files

Repository may contain:

.env.example

It must NOT contain real credentials.

Example:

DATABASE_URL=postgresql://user:password@localhost:5432/devtrack
AUTH_SECRET=replace-me
PORT=3000

Local developer may create:

.env

Production values should come from the deployment environment / Harness secrets.

Never commit:

.env
service-account.json
private keys
database passwords
auth secrets

⸻

44. Logging

Use structured logging.

Recommended:

Pino.

Example event:

{
  "level": "info",
  "requestId": "req_123",
  "method": "POST",
  "path": "/api/v1/tasks",
  "statusCode": 201,
  "durationMs": 42
}

Useful context:

* request ID
* route
* status
* duration
* user ID when safe
* error code

Never log:

* password
* auth cookie
* database password
* secret tokens

Do not add 500 debug console.log() calls and leave them in production.

⸻

45. Request IDs

Generate or accept a request ID for each API request.

Flow:

request
   ↓
requestId
   ↓
controller
   ↓
service
   ↓
repository
   ↓
logs

This makes debugging much easier.

This is a small feature that makes the project feel significantly more professional.

Do not over-build distributed tracing.

A request ID is enough for V1.

⸻

46. Code Style Principles

This section is mandatory.

The codebase should optimize for:

READABILITY
    ↓
PREDICTABILITY
    ↓
TESTABILITY
    ↓
CHANGEABILITY

not:

CLEVERNESS

Rules:

1. One primary responsibility per file.

2. Use descriptive names.

Good:

findProjectsForUser()

Bad:

getData()

3. Prefer small functions.

A 15–40 line function is often easier to understand than a 180-line function.

This is guidance, not an arbitrary hard limit.

4. Use early returns.

Prefer:

if (!project) {
  throw new NotFoundError(...)
}

over deeply nested logic.

5. No unexplained magic values.

Bad:

if (password.length < 8)

if 8 is repeated everywhere.

Centralize a requirement when it is shared policy.

6. Avoid `any`.

7. Avoid giant utility files.

If utils.ts becomes a home for unrelated functions, split by purpose.

8. Avoid premature abstractions.

Do not create:

BaseRepositoryFactoryProviderAdapter

because two repositories share three lines.

9. Comments explain WHY.

Bad:

// increment count
count++

Better:

// Exclude completed tasks so the card represents work still requiring action.

10. Delete dead code.

Do not leave:

old implementation
commented code
temporary fallback
unused function

because AI may need it later.

Git already preserves history.

⸻

47. Abstraction Budget

Every abstraction has a cost.

Before creating an interface/class/helper, ask:

What problem does this solve?

Good abstraction:

apiClient

because every feature needs consistent HTTP behavior.

Good abstraction:

AppError

because every endpoint needs consistent error behavior.

Good abstraction:

ProjectRepository

because project persistence should be isolated.

Questionable abstraction:

IStringFormatterFactory

used by one three-line function.

The project should contain enough structure to teach architecture without burying the learner under ceremony.

⸻

48. Classes vs Functions

Default to functions/modules.

Use a class when:

* there is meaningful instance state
* lifecycle matters
* the abstraction naturally represents an object with behavior

Do NOT convert every service into a class merely because enterprise examples do so.

For example:

export async function createTask(...)

is perfectly acceptable.

Simplicity is a feature.

⸻

49. Naming Rules

Files:

task.service.ts
task.repository.ts
task.schema.ts

Functions:

createTask()
findTaskForUser()
updateTaskStatus()

Booleans:

isAuthenticated
hasCompletedTasks
canDeleteProject

Avoid:

doThing()
handler2()
temp()
finalData()
stuff()
obj()
processData()

The name should help explain the code before the reader opens the function.

⸻

50. Type Rules

TypeScript strict mode must pass.

Prefer:

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"

or generated/shared enum types.

Functions should have clear input/output types when inference is not obvious.

Do not cast errors away with:

as any
as unknown as Something

unless the reason is understood and documented.

Validation should convert untrusted input into trusted typed data.

⸻

51. Date Rules

Store dates in UTC.

API dates should use ISO-8601 strings.

Example:

2026-10-03T18:30:00.000Z

The frontend is responsible for formatting dates for display.

Do not store presentation strings like:

"Tomorrow at 4 PM"

in the database.

Store real timestamps.

⸻

52. ID Rules

Use stable generated IDs.

UUIDs are acceptable.

Do not expose sequential IDs because they are easier.

The important security control is still ownership validation.

UUIDs do not replace authorization.

⸻

53. Search and Filtering

V1 filters:

* status
* priority
* text search

Filtering request:

GET /api/v1/projects/:projectId/tasks?status=IN_PROGRESS&priority=HIGH&q=harness

Backend should construct a safe database query.

Do not:

load every task
   ↓
send all to frontend
   ↓
filter everything in browser

for data that should be filtered by the server.

For a small local state the frontend may additionally filter presentation data, but the API should support the real query.

⸻

54. Dashboard Computation

Dashboard should show:

* active project count
* total open tasks
* completed tasks
* tasks grouped by status
* recent projects

Prefer one intentional summary query/use case.

Example:

GET /api/v1/dashboard/summary

Do not force the frontend to make 15 requests and calculate the entire dashboard itself.

⸻

55. Delete Behavior

Project deletion is destructive.

V1 choices:

Option A:

hard delete project and tasks.

Option B:

soft archive project.

Recommended V1:

Use delete with explicit confirmation if simplicity is the priority.

Potential V2:

Add archive.

Whatever choice is made must be documented.

Do not secretly implement both.

⸻

56. Testing Philosophy

Testing is part of the project.

Not something added after all code is finished.

Test important behavior.

Do not chase coverage by testing implementation details.

Test pyramid:

             E2E
            /   \
       Integration
       /         \
        Unit Tests

Many unit/integration tests.

A small number of end-to-end tests.

⸻

57. Unit Tests

Test pure or focused logic.

Examples:

* project progress calculation
* task filter parsing
* auth input validation
* dashboard calculations when separated from persistence
* error mapping helpers
* date helpers
* shared schemas

Do not test:

“1 + 1 = 2”

just to increase coverage.

⸻

58. Backend Integration Tests

This is extremely important.

Test API + real test database behavior.

Examples:

Register

POST /auth/register
   ↓
201
   ↓
user exists
   ↓
password is not stored in plain text

Login

valid credentials
   ↓
200
   ↓
auth cookie exists

Ownership

User A creates project
User B requests project
   ↓
404/403 according to chosen policy

Create Task

authenticated user
   ↓
valid project
   ↓
valid body
   ↓
201
   ↓
task stored

Invalid Task

missing title
   ↓
400
   ↓
standard validation response

⸻

59. Frontend Tests

Use React Testing Library.

Test behavior users care about.

Examples:

Login form

* renders fields
* displays validation
* disables/shows loading during submission
* shows API error

Task form

* requires title
* submits valid values
* displays server failure

Project page

* shows loading state
* shows empty state
* renders tasks
* applies selected filters

Do not test internal React implementation details.

⸻

60. End-to-End Tests

Use Playwright for a small set of full workflows.

V1 requires at least:

Test 1:

Register
   ↓
Create Project
   ↓
Create Task
   ↓
Move Task to Done
   ↓
Dashboard reflects completion

Test 2:

Login
   ↓
Open Project
   ↓
Search Task
   ↓
Edit Task
   ↓
Logout

These tests demonstrate that the complete application works.

Do not create 100 E2E tests.

They are slower and more expensive to maintain.

⸻

61. Test Database

Never run automated tests against the production database.

Use a separate test database.

Local concept:

PostgreSQL container
├── devtrack_dev
└── devtrack_test

or separate containers.

Tests should be able to:

* migrate schema
* create isolated data
* clean/reset predictably

The reset strategy must be documented.

⸻

62. Test Coverage

Suggested target:

Overall:

≥75%

Backend service/business logic:

≥85%

Do not manipulate tests purely to hit the number.

A meaningful 72% is better than a fake 95%.

However, important authorization and business logic should be thoroughly covered.

⸻

63. Docker

Docker packages the application into a repeatable runtime.

Production concept:

Source code
   ↓
build
   ↓
Docker image
   ↓
container

The Dockerfile should use multi-stage builds.

Concept:

Stage 1 — dependencies

Install required packages.

Stage 2 — build

Build frontend/backend.

Stage 3 — runtime

Copy only production requirements and built output.

Do not ship the entire development environment in the final runtime image.

⸻

64. Production Container

The final container should:

1. start the Express backend
2. expose the API
3. serve the built React frontend
4. listen on the configured PORT
5. log to stdout/stderr
6. read configuration from environment variables

One image.

One service.

One deployment.

That is intentionally simple.

⸻

65. Docker Compose

Use docker-compose.yml for local dependencies.

At minimum:

PostgreSQL.

Possible local flow:

docker compose up -d db

npm install

npm run db:migrate

npm run dev

Do not force the developer to run the entire application inside Docker during normal development if that makes debugging harder.

Docker should solve repeatability.

It should not make local learning painful.

⸻

66. Health Endpoint

Add:

GET /api/v1/health

Basic response:

{
  "data": {
    "status": "ok"
  }
}

Optional deeper check:

GET /api/v1/health/ready

which may verify database connectivity.

The deployment pipeline can use this for smoke checking.

Do not expose secrets or internal environment details.

⸻

67. Git

Use Git from the beginning.

Commit history should show understandable progress.

Good commits:

feat: add project creation API
test: cover project ownership
feat: add task status filtering
ci: add Harness PR validation pipeline
docs: document deployment flow

Bad:

stuff
works
final
final-final
fix
fix2

Do not create one giant final commit containing the whole project.

⸻

68. Branch Workflow

Keep it simple.

main

Production-ready branch.

Feature branches:

feat/task-filters
feat/authentication
ci/harness-pipeline
fix/project-ownership

Workflow:

branch
  ↓
commit
  ↓
push
  ↓
Pull Request
  ↓
Harness validation
  ↓
review
  ↓
merge

This makes the Harness integration visible during normal development.

⸻

69. Pull Requests

PRs should be small enough to review.

PR description should include:

What changed?

Why?

How was it tested?

Screenshots when UI changed.

Any migration?

Any Harness/pipeline impact?

Do not merge a PR simply because the AI says the feature is complete.

The developer must inspect the diff.

⸻

70. What Harness Is Doing in This Project

Harness is not the application framework.

Harness is the software-delivery platform around the application.

Core flow:

Developer
   ↓
Git push / Pull Request
   ↓
GitHub
   ↓
Harness trigger
   ↓
Harness pipeline
   ↓
CI validation
   ↓
artifact creation
   ↓
deployment
   ↓
running application

Harness should demonstrate that the developer understands how code moves from repository to production.

⸻

71. Harness Concepts Used

Use only the concepts that have a clear purpose.

Pipeline

The full automated workflow.

Stage

A major section of the pipeline.

Step

One specific task inside a stage.

Codebase

The Git repository Harness checks out.

Connector

A Harness resource that describes how Harness connects to another system.

Examples:

* GitHub
* Google Cloud
* artifact registry

Trigger

Starts the pipeline when an event happens.

Secret

Stores a sensitive value.

Artifact

The built deployable output.

For this project:

Docker image.

Service

In Harness CD, represents what is being deployed.

Environment

Represents the logical destination such as staging or production.

Infrastructure definition

Connects the environment to the actual target infrastructure.

Input Set

A reusable set of runtime values.

Use it only once the pipeline actually needs environment-specific values.

Delegate / runner

Execution infrastructure Harness can use when managed Harness Cloud execution is not available or not appropriate.

These concepts should be explained in:

docs/HARNESS.md

⸻

72. Harness Build Infrastructure

Preferred development path:

Harness Cloud build infrastructure

if it is available to the account.

Fallback:

Harness local Docker runner/self-managed execution.

Do NOT add Kubernetes just to run CI.

Important practical note:

Harness availability and free-tier execution options can depend on account configuration.

Therefore the project must not architect itself around one runner type.

The pipeline logic should remain:

checkout
→ install
→ lint
→ typecheck
→ test
→ build

while execution infrastructure can change.

⸻

73. Harness Project Setup

Create one Harness Project:

DevTrack

Recommended Harness resources:

Project
├── Connectors
│   ├── github
│   └── gcp
│
├── Secrets
│   ├── production_database_url
│   └── auth_secret
│
├── Pipelines
│   ├── devtrack-pr-validation
│   └── devtrack-release
│
├── Services
│   └── devtrack
│
└── Environments
    └── production

Potential V1.5:

staging

Keep resources at project scope unless there is a specific reason to share them at organization/account scope.

⸻

74. GitHub Connector

Harness needs a connector to access the repository.

Purpose:

Harness
   ↓
GitHub connector
   ↓
devtrack repository

It enables the CI pipeline to clone the codebase.

Use the minimum permissions required.

Do not give unrelated repository/admin permissions merely because setup becomes easier.

Document:

* authentication method used
* permissions granted
* why they are required

Never store a GitHub token in source code.

⸻

75. GCP Connector

Harness needs authenticated access to deployment resources.

Purpose:

Harness
   ↓
GCP connector
   ↓
Google Artifact Registry
   ↓
Google Cloud Run

Prefer short-lived/identity-based authentication such as OIDC when the account setup makes it practical.

For a learning setup, a least-privilege service account credential stored securely may be used if needed.

Never commit the credential file.

Document the exact permissions granted.

Avoid broad project-owner permissions.

⸻

76. Artifact Registry

The application should be packaged as a Docker image.

Use Google Artifact Registry.

Artifact flow:

source
   ↓
Harness CI
   ↓
Docker build
   ↓
devtrack:<commit-sha>
   ↓
Google Artifact Registry
   ↓
Harness CD
   ↓
Cloud Run

Do not deploy an untraceable image tagged only:

latest

Recommended immutable tag:

Git commit SHA.

Example:

devtrack:8f3a92c

This creates traceability:

Production revision
   ↓
Docker image tag
   ↓
Git commit
   ↓
source change

⸻

77. Harness PR Validation Pipeline

Pipeline:

devtrack-pr-validation

Trigger:

Pull Request opened
Pull Request updated

Stages:

Stage 1 — Validate

Steps:

1. Clone codebase
2. Install dependencies
3. Lint
4. Type check
5. Run unit tests
6. Start/provide PostgreSQL test dependency
7. Run backend integration tests
8. Build application

Concept:

PR
 ↓
Harness
 ↓
npm ci
 ↓
npm run lint
 ↓
npm run typecheck
 ↓
npm run test
 ↓
npm run test:integration
 ↓
npm run build
 ↓
PASS / FAIL

No deployment from ordinary PRs.

A failed quality check should block the normal merge workflow.

⸻

78. Harness PostgreSQL Test Dependency

Integration tests need PostgreSQL.

Harness CI can run a PostgreSQL background dependency when supported by the selected build infrastructure.

Concept:

CI Stage

├── Background PostgreSQL
│
├── Install
├── Migrate Test DB
├── Integration Tests
└── Build

Test database credentials should come from test-safe configuration/secrets.

Never point CI integration tests at production.

⸻

79. Harness Release Pipeline

Pipeline:

devtrack-release

Trigger:

merge/push to main

Flow:

main updated
   ↓
Validate
   ↓
Build Docker image
   ↓
Push image to Artifact Registry
   ↓
Deploy
   ↓
Smoke test
   ↓
success

Stages:

Stage 1 — Validate

* install
* lint
* typecheck
* tests
* build

Stage 2 — Package

* build Docker image
* tag with commit SHA
* push to Artifact Registry

Stage 3 — Deploy Production

* deploy exact artifact
* inject production configuration/secrets
* wait for deployment
* run smoke test

Do not rebuild a different image during deployment.

Build once.

Deploy the same artifact.

⸻

80. V1.5 Staging Pipeline

Only after the basic release pipeline works:

Validate
   ↓
Build Artifact
   ↓
Deploy Staging
   ↓
Smoke Test
   ↓
Manual Approval
   ↓
Deploy Production
   ↓
Smoke Test

This teaches an important concept:

artifact promotion.

The exact same image moves from staging to production.

Do not rebuild it between environments.

This is optional until V1 works.

⸻

81. Harness Pipeline as Code

Store Harness pipeline definitions in Git when practical.

Recommended:

infrastructure/harness/pipelines/

Example:

devtrack-pr-validation.yaml
devtrack-release.yaml

Why?

Pipeline changes become:

* reviewable
* versioned
* traceable
* documented beside application code

Do not manually change the UI and leave the repository copy stale.

Choose a clear source of truth.

Document it.

⸻

82. Harness Visual Editor vs YAML

The developer should use both.

Visual editor:

Useful for understanding stages and steps.

YAML:

Useful for understanding the actual configuration.

Learning workflow:

Create/inspect visually
        ↓
open YAML
        ↓
understand structure
        ↓
store/review configuration

Do not treat pipeline YAML as magical generated text.

The developer should be able to identify:

pipeline
stages
steps
connectors
variables
secrets
triggers

⸻

83. Harness Secrets

Store production secrets outside Git.

Examples:

DATABASE_URL
AUTH_SECRET

Harness secret reference
   ↓
deployment environment variable
   ↓
application

Never echo a secret in a pipeline command.

Never print:

env

blindly in CI logs.

Never commit:

production_database_url=...

Document secret names, not secret values.

⸻

84. Deployment Target

Use Google Cloud Run for production.

Why:

* runs containers
* does not require managing Kubernetes
* fits a single-container application
* teaches cloud deployment without creating a large infrastructure project

Concept:

Artifact Registry image
       ↓
Cloud Run service
       ↓
HTTPS URL
       ↓
user

The project is about software delivery.

Not cluster administration.

⸻

85. Production Database

Use managed PostgreSQL.

Do not run the production database inside the same application container.

Production:

Cloud Run App
     │
     ▼
Managed PostgreSQL

Local:

Node App
     │
     ▼
Docker PostgreSQL

This separation teaches that application compute and durable database state have different lifecycles.

⸻

86. Production Database Migrations

Database migrations must be handled deliberately.

Do not let every application instance race to run migrations on startup.

V1 acceptable strategy:

Harness deployment flow
   ↓
migration step
   ↓
deploy application

The migration command should run once per deployment.

If a migration fails:

deployment should stop.

Document migration rollback limitations.

Do not pretend every schema change can be automatically rolled back safely.

⸻

87. Smoke Test

After deployment:

Run a small external check.

Example:

GET https://<app>/api/v1/health

Expected:

200

Optional:

load root page
expect successful response

Smoke test answers:

“Did the deployed application start and respond?”

It is not a replacement for unit/integration tests.

⸻

88. Failure Strategy

Pipeline behavior should be intentional.

If lint fails:

stop.

If type checking fails:

stop.

If tests fail:

stop.

If Docker build fails:

stop.

If image push fails:

stop.

If migration fails:

do not deploy new application.

If deployment fails:

pipeline fails clearly.

If smoke test fails:

mark release unsuccessful and investigate/rollback using the documented process.

Do not add automatic retries everywhere.

Retries are useful for genuinely transient operations, not for hiding deterministic failures.

⸻

89. Deployment Traceability

Every production deployment should be traceable to:

* pipeline execution
* Git commit
* Docker image
* deployment time

Display build metadata inside the application optionally.

Example endpoint:

GET /api/v1/version

Response:

{
  "data": {
    "version": "8f3a92c",
    "builtAt": "..."
  }
}

Do not expose sensitive environment details.

This makes demos excellent:

UI
 ↓
version
 ↓
Harness execution
 ↓
Git commit

⸻

90. Security Requirements

This is not a security product.

But basic application security is mandatory.

Authentication:

* hash passwords
* secure cookie
* strong secret

Authorization:

* every project/task access scoped to owner

Input:

* Zod validation

HTTP:

* security headers
* HTTPS in production

Database:

* ORM/parameterized queries
* least-privilege credentials

Secrets:

* outside Git
* stored securely

Logging:

* no credentials/tokens/passwords

Dependencies:

* keep packages updated
* no unnecessary package explosion

Errors:

* no production stack traces returned to users

⸻

91. Security Headers

Use a standard security middleware such as Helmet.

Do not manually invent every HTTP security header.

Understand at a high level why it exists.

Document:

“Helmet configures common HTTP response headers that reduce several classes of browser-related risk.”

Do not include a tool solely to list its name on the CV.

⸻

92. Rate Limiting

Add modest rate limiting to authentication routes.

Examples:

login
register

Purpose:

reduce trivial brute-force abuse.

Do not build a distributed global rate-limiting platform.

For one application instance / learning project, a simple implementation is sufficient.

Document its limitations.

⸻

93. CORS

Because production frontend and backend are served from the same application origin, broad CORS configuration is not required.

This is intentional.

Do NOT add:

Access-Control-Allow-Origin: *

without understanding why.

During local development, if frontend/backend use different ports, configure only the known local origin.

⸻

94. Seed Data

Provide a development seed script.

Example:

Demo User
├── Harness Project
│   ├── Configure GitHub connector
│   ├── Add CI pipeline
│   └── Deploy to Cloud Run
│
└── Portfolio Project
    ├── Add project screenshot
    └── Write README

Seed data should make the UI useful immediately.

Do not seed production automatically.

⸻

95. Empty States

Every major list needs a useful empty state.

Projects empty:

“No projects yet.”

[ Create your first project ]

Tasks empty:

“No tasks match these filters.”

or:

“This project has no tasks yet.”

[ Create task ]

Do not show a blank white box and expect the user to understand.

⸻

96. Loading States

Do not let buttons appear frozen.

Examples:

Logging in…

Creating task…

Saving…

Loading projects…

For page-level loading:

use clean placeholders/spinner.

Avoid artificial loading animations.

The UI should reflect real system state.

⸻

97. Error States

Frontend errors should be useful.

Bad:

Something went wrong.

Better:

Could not load this project. Try again.

For known validation:

“Title must be at least 1 character.”

For auth:

“Email or password is incorrect.”

Do not expose:

SQL query failed at...
Prisma stack trace...
JWT secret...

to end users.

⸻

98. Observability

V1:

structured logs
request IDs
Harness execution logs
Cloud Run logs

Measure:

* HTTP status
* request duration
* deployment success/failure
* test duration

Optional V2:

OpenTelemetry
metrics dashboard
error tracking service

Do not turn V1 into an observability project.

⸻

99. Performance

Do not optimize prematurely.

But avoid obvious problems.

Examples:

* filter in database
* select only needed fields when sensible
* index unique email
* consider indexes on project_id/status if queries justify them
* avoid repeated queries inside loops
* avoid sending huge unnecessary payloads

Measure before adding caching.

Redis is NOT required.

⸻

100. Dependency Management

Keep dependencies deliberate.

Before adding a package ask:

1. What problem does it solve?
2. Is the problem real?
3. Can existing code handle it simply?
4. Is the package actively maintained?
5. Does it introduce significant complexity?

Do not install five libraries for formatting dates, IDs, and class names unless actually needed.

Lock dependency versions through the package lockfile.

Use:

npm ci

in CI.

⸻

101. AI Implementation Rules

This section is mandatory if AI writes substantial code.

AI must NOT be prompted:

“Build the whole project.”

Instead implement one vertical slice or ticket at a time.

Required AI workflow:

1. Explain the intended change.
2. Identify files that should change.
3. Explain why those files own that responsibility.
4. Reuse existing patterns.
5. Implement the smallest coherent change.
6. Add/update tests.
7. Run lint/typecheck/tests.
8. Summarize architectural impact.
9. Do not introduce a new library without explaining why.
10. Do not refactor unrelated code during a feature unless required.

Every AI implementation prompt should contain:

“Preserve the existing architecture and naming conventions. Do not create duplicate clients, schemas, utilities, services, state patterns, or validation systems. Prefer editing the existing responsible module over creating a parallel implementation.”

⸻

102. AI Change Review Checklist

After AI writes code, the developer must inspect:

Architecture

* Is logic in the correct layer?
* Did it bypass the service/repository pattern?
* Did it add random files?

Duplication

* Did it recreate an existing type/helper/client?
* Did it copy code instead of reusing a real abstraction?

Complexity

* Is this more complicated than the feature requires?
* Did it create unnecessary classes/interfaces?

Types

* Any `any`?
* Unsafe casts?
* duplicated DTO definitions?

Errors

* consistent AppError?
* useful user message?

Tests

* were meaningful tests added?
* do they test behavior?

Security

* authorization still enforced?
* any secret/logging problem?

Documentation

* does architecture or Harness documentation need updating?

The developer should reject AI output that violates the structure even if it “works.”

⸻

103. No Random Refactors Rule

When implementing:

“Add task due date”

AI should NOT also:

* rename the auth system
* replace TanStack Query
* rewrite all API responses
* swap Prisma
* redesign folders
* change styling framework

Keep PRs focused.

Unrelated cleanup should become a separate change.

This makes Git history understandable.

⸻

104. Engineering Consistency Rule

Once a pattern is established, use it consistently.

Example:

All modules use:

route
→ controller
→ service
→ repository

Do not make:

projects use service/repository

while:

tasks put Prisma calls in routes

and:

dashboard talks to database from middleware.

Consistency lowers the cognitive load required to learn the project.

⸻

105. When to Refactor

Refactor when:

* duplicated logic appears repeatedly
* one file has multiple unrelated responsibilities
* a feature is difficult to test
* dependency direction is wrong
* names no longer match behavior
* changes repeatedly require editing unrelated code

Do NOT refactor because:

“this pattern looks more enterprise.”

Every refactor should solve a real maintainability problem.

⸻

106. Documentation Requirements

Documentation should be unusually good because the project is designed for learning.

Required:

README.md
ARCHITECTURE.md
API.md
DATABASE.md
HARNESS.md
DESIGN_DECISIONS.md
WALKTHROUGH.md
STUDY_GUIDE.md

The developer should be able to relearn the project months later using only the repository.

⸻

107. README.md

README should explain:

1. What DevTrack is
2. Screenshots/demo
3. Major features
4. Technology stack
5. Architecture summary
6. Local prerequisites
7. Installation
8. Environment setup
9. Database setup
10. Development commands
11. Testing
12. Docker
13. Harness CI/CD overview
14. Deployment
15. Documentation links

Avoid an enormous badge wall.

README is the entry point.

Not the entire architecture book.

⸻

108. ARCHITECTURE.md

Include diagrams for:

System architecture

React
 ↓
REST API
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL

Authentication flow

Login
 ↓
validate
 ↓
verify hash
 ↓
cookie
 ↓
authenticated request

Create Task flow

UI
 ↓
API
 ↓
controller
 ↓
service
 ↓
repository
 ↓
database

Deployment architecture

GitHub
 ↓
Harness
 ↓
Artifact Registry
 ↓
Cloud Run
 ↓
PostgreSQL

Explain dependency direction.

⸻

109. API.md

Document each endpoint.

Example:

POST /api/v1/projects

Authentication:

Required.

Body:

{
  "name": "Harness Project",
  "description": "..."
}

Success:

201

Validation errors:

400

Possible application errors:

401
409 etc. when relevant.

Do not manually duplicate documentation so extensively that it always becomes stale.

Keep it focused on stable contracts.

⸻

110. DATABASE.md

Explain:

Tables

User
Project
Task

Relationships.

Constraints.

Indexes.

Migration workflow.

Local database.

Test database.

Production database.

Also include example SQL for learning:

SELECT *
FROM "Task"
WHERE "projectId" = ...;

The application may use Prisma, but the developer should be able to describe the underlying relational model.

⸻

111. HARNESS.md

This is one of the most important project documents.

Explain:

What Harness is doing.

Why it exists in the project.

Resources:

* project
* connectors
* secrets
* pipelines
* service
* environment
* infrastructure

PR pipeline:

PR
→ validate

Release pipeline:

main
→ validate
→ image
→ registry
→ deploy
→ smoke test

Explain every stage.

Explain every step.

Explain every secret reference.

Explain artifact tagging.

Explain the chosen build infrastructure.

Explain how to switch between Harness Cloud and local/self-managed runner when necessary.

Explain how to manually execute the pipeline.

Explain common failures.

The user should be able to learn Harness from this file after the implementation is complete.

⸻

112. DESIGN_DECISIONS.md

Document decisions in this format:

Problem
→ Alternatives
→ Decision
→ Trade-offs

Required entries:

Why React?

Why TypeScript?

Why Express?

Why modular monolith?

Why PostgreSQL?

Why Prisma?

Why REST?

Why same-origin frontend/backend production deployment?

Why one Docker image?

Why Harness?

Why two pipelines?

Why Cloud Run?

Why not Kubernetes?

Why not microservices?

Why no Redis?

Why service/repository separation?

Why Zod?

Why TanStack Query?

Why managed Postgres?

Why immutable commit-SHA image tags?

This file is excellent interview preparation.

⸻

113. WALKTHROUGH.md

A newcomer should be able to trace exact code.

Example:

Create Task button
 ↓
TaskForm.tsx
 ↓
useCreateTask.ts
 ↓
tasks.api.ts
 ↓
POST /api/v1/projects/:id/tasks
 ↓
task.routes.ts
 ↓
task.controller.ts
 ↓
task.service.ts
 ↓
task.repository.ts
 ↓
Prisma
 ↓
PostgreSQL

Then response back upward.

Also include:

Login flow.

Project creation.

Dashboard summary.

Harness PR pipeline.

Harness release pipeline.

Use real file/function names after implementation.

Do not leave placeholder names forever.

⸻

114. STUDY_GUIDE.md

Create a 16-day reading/rebuild plan.

Day 1

Repository structure and architecture.

Day 2

React pages and components.

Day 3

Frontend API client and TanStack Query.

Day 4

Express application lifecycle.

Day 5

Routes/controllers/services/repositories.

Day 6

PostgreSQL + Prisma + migrations.

Day 7

Authentication.

Day 8

Authorization and validation.

Day 9

Testing strategy.

Day 10

Docker and local environments.

Day 11

Git/GitHub workflow.

Day 12

Harness fundamentals.

Day 13

Harness PR validation pipeline.

Day 14

Docker artifact + registry.

Day 15

Harness deployment + Cloud Run.

Day 16

Full system walkthrough.

At the end of each day include:

Explain without notes:

3–5 questions.

Modify yourself:

one small coding exercise.

Example:

Day 5 exercise:

Add project description length validation without asking AI for implementation.

⸻

115. LEARNING_LOG.md

Recommended additional file:

docs/LEARNING_LOG.md

For each major feature write:

What I built.

What I initially did not understand.

What files are involved.

What broke.

How I fixed it.

What I could now explain in an interview.

This converts AI-assisted development into active learning.

⸻

116. Local Development Experience

Target setup:

git clone
 ↓
npm install
 ↓
copy .env.example → .env
 ↓
docker compose up -d db
 ↓
npm run db:migrate
 ↓
npm run db:seed
 ↓
npm run dev

The application should be usable.

If local setup requires 30 manual undocumented steps, the engineering is not finished.

⸻

117. Developer Commands

Root commands should be documented.

Recommended:

npm run dev

Run frontend/backend development.

npm run lint

Lint all workspaces.

npm run typecheck

Run TypeScript checking.

npm run test

Run unit tests.

npm run test:integration

Run backend integration tests.

npm run test:e2e

Run Playwright.

npm run build

Create production build.

npm run db:migrate

Run development migrations.

npm run db:seed

Load demo data.

npm run format

Format code.

Exact tooling may change.

Command purpose should remain obvious.

⸻

118. CI Quality Gate

Every Pull Request should pass:

install
lint
typecheck
unit tests
integration tests
build

Optional once stable:

E2E smoke workflow

Do not merge if required quality gates fail.

The Harness pipeline is part of the definition of done.

⸻

119. Code Formatting

Use one formatting configuration.

Prettier.

Formatting should be automatic.

Do not spend review time arguing about spaces.

CI should verify formatting or lint rules according to the selected configuration.

Avoid excessive custom style rules.

⸻

120. Linting

Use ESLint.

Rules should detect real problems.

Examples:

* unused variables
* unsafe patterns
* React hook mistakes
* accidental promises when configured

Do not create 150 custom lint rules in V1.

Linting should improve consistency.

Not become a separate project.

⸻

121. Type Checking

Run:

tsc --noEmit

or equivalent workspace typecheck.

CI must fail when type errors exist.

Do not hide errors with mass:

// @ts-ignore

If a suppression is necessary, document why next to the narrow line.

⸻

122. Production Build

Root build should produce deployable output predictably.

Concept:

build web
   ↓
static assets
   ↓
build API
   ↓
copy/serve web assets
   ↓
production server

Document where artifacts go.

Example:

apps/web/dist
apps/api/dist

The Docker build should consume these outputs appropriately.

⸻

123. Build Reproducibility

CI should use:

npm ci

not:

npm install

for normal clean builds.

Commit package-lock.json.

Node version should be pinned/documented.

Docker base image should use a deliberate version.

Do not depend on “whatever latest happens to be today.”

⸻

124. Production Configuration

Production should configure:

NODE_ENV=production
PORT=<provided>
DATABASE_URL=<secret>
AUTH_SECRET=<secret>
APP_VERSION=<commit-sha>

No production values hardcoded in the image.

Same image should be configurable for an environment.

⸻

125. Deployment Environment

Harness production environment:

production

Harness service:

devtrack

Infrastructure:

Google Cloud Run target.

Document:

What are we deploying?

DevTrack Docker image.

Where logically?

Production.

Where physically?

The configured Cloud Run service/project/region.

This mapping teaches Harness CD concepts clearly.

⸻

126. Optional Approval

Do not require a production approval in the earliest version.

Once CI/CD works, an approval step can be added before production.

Purpose:

Demonstrate controlled release.

Do not add approval merely for decoration.

It should be explained as:

A human release gate between validated staging and production.

⸻

127. Optional Harness Templates

Do NOT start by templating everything.

Templates are useful when pipeline logic is genuinely reused.

V1:

plain readable pipelines.

V2:

extract common validation steps/stages if duplication becomes meaningful.

Premature templates make a beginner pipeline harder to understand.

⸻

128. Optional Harness Security Scanning

Do NOT make Harness Security Testing Orchestration or every security product mandatory in V1.

Potential V2:

* dependency scan
* container scan
* security stage

Only add after:

CI
CD
tests
deployment

are fully understood.

The learning objective is first the delivery lifecycle.

⸻

129. Optional Feature Flags

Feature flags are V2.

Example future feature:

new dashboard layout

Deployment:

code deployed

Release:

flag controls visibility

This teaches:

deployment ≠ release

But do not add feature management until the normal deployment system works.

⸻

130. What NOT to Build

This section is important.

Do NOT add initially:

* Kubernetes
* Kafka
* RabbitMQ
* Redis
* microservices
* GraphQL
* Terraform
* service mesh
* custom auth provider
* OAuth with five providers
* organizations
* team invitations
* RBAC matrix
* real-time collaborative editing
* WebSockets
* chat
* comments
* file attachments
* billing
* payments
* mobile app
* AI assistant
* recommendation engine
* custom analytics platform
* custom design system package
* event sourcing
* CQRS
* separate database per module
* multi-region deployment

The objective is engineering depth.

Not technology count.

⸻

131. V1 Scope

MUST HAVE

Product:

✓ Register
✓ Login
✓ Logout
✓ Dashboard
✓ Projects CRUD
✓ Tasks CRUD
✓ Task status
✓ Priority
✓ Due date
✓ Search
✓ Filters
✓ Responsive usable UI
✓ Empty/loading/error states

Backend:

✓ REST API
✓ Validation
✓ Authentication
✓ Authorization
✓ Standard errors
✓ PostgreSQL
✓ migrations
✓ structured logging
✓ health endpoint

Quality:

✓ TypeScript strict
✓ ESLint
✓ formatting
✓ unit tests
✓ integration tests
✓ small E2E suite

Delivery:

✓ Docker image
✓ GitHub repo
✓ Harness Git connector
✓ Harness PR pipeline
✓ Harness release pipeline
✓ Harness secrets
✓ Artifact Registry
✓ Cloud Run deployment
✓ smoke test
✓ commit-SHA artifact tagging

Documentation:

✓ README
✓ ARCHITECTURE
✓ API
✓ DATABASE
✓ HARNESS
✓ DESIGN_DECISIONS
✓ WALKTHROUGH
✓ STUDY_GUIDE

That is already a strong project.

⸻

132. V1.5

Only after V1 works:

* staging environment
* same-artifact promotion
* manual approval
* improved deployment failure handling
* version endpoint shown in UI
* CI caching if builds are meaningfully slow
* improved dashboard visualization
* project archive instead of hard delete

⸻

133. V2

Potential additions:

* team collaboration
* task assignees
* project activity history
* comments
* feature flags
* security scan stage
* deployment verification improvements
* stronger observability
* OAuth
* email notifications
* reusable Harness stage templates

Add features only when the developer can explain V1 without help.

⸻

134. Development Order

Do not start by building the Harness pipeline.

Do not start by polishing the dashboard.

Build in vertical, understandable phases.

⸻

Phase 1 — Repository Foundation

Create:

* npm workspaces
* frontend app
* backend app
* shared config
* lint
* format
* TypeScript
* root scripts

Goal:

npm run lint
npm run typecheck
npm run build

should work on a minimal application.

⸻

Phase 2 — Database Foundation

Implement:

User
Project
Task

Add:

* Prisma
* PostgreSQL
* migration
* seed

Goal:

The developer can explain every relationship.

⸻

Phase 3 — Backend Project Slice

Build:

POST /projects
GET /projects
GET /projects/:id
PATCH /projects/:id
DELETE /projects/:id

Initially use a temporary development user only if needed while the backend shape is being learned.

Then remove temporary shortcuts before authentication is considered complete.

Tests required.

⸻

Phase 4 — Frontend Project Slice

Build:

Projects page
Create project
Edit project
Delete project

Flow must work:

React
→ API
→ backend
→ database
→ UI refresh

At this point the first full vertical slice exists.

⸻

Phase 5 — Authentication

Implement:

register
login
logout
me
secure cookie
password hashing
auth middleware

Then update project ownership.

Tests:

User A cannot access User B data.

⸻

Phase 6 — Tasks

Build:

Task model/API/UI.

Then:

status
priority
due date
filters
search

Do not implement drag-and-drop yet.

⸻

Phase 7 — Dashboard

Implement:

summary endpoint
dashboard UI
real counts

No fake cards.

⸻

Phase 8 — Error/Loading/Polish

Add:

* empty states
* loading states
* error states
* confirmations
* responsive behavior
* accessibility baseline

Now the product should feel complete.

⸻

Phase 9 — Testing Hardening

Add/complete:

* service tests
* API integration tests
* frontend tests
* two E2E workflows

Fix architecture problems discovered by tests.

Do not mock everything merely to make tests easy.

⸻

Phase 10 — Docker

Build:

production Dockerfile
local Docker Compose database

Run:

docker build
docker run

Verify application works outside the normal dev environment.

⸻

Phase 11 — GitHub Workflow

Clean:

* branches
* commits
* PR template
* README

Create a normal feature PR.

This becomes the input for Harness CI.

⸻

Phase 12 — Harness PR Pipeline

Create:

devtrack-pr-validation

Implement:

checkout
install
lint
typecheck
test
integration
build

Make a PR fail intentionally.

Example:

introduce type error.

Observe Harness failure.

Fix it.

Observe success.

This proves the pipeline is real.

⸻

Phase 13 — Artifact Pipeline

Add:

Docker build
commit SHA tag
Google Artifact Registry push

Verify:

Git commit
→ exact image

Understand this completely before deployment.

⸻

Phase 14 — Harness CD

Create:

service
environment
infrastructure
secrets

Deploy image to Cloud Run.

Then add health smoke check.

⸻

Phase 15 — Documentation

Write real file/function names into:

ARCHITECTURE
HARNESS
WALKTHROUGH
DESIGN_DECISIONS

Do not leave docs as generic plans.

⸻

Phase 16 — Learning Pass

The AI stops implementing.

The developer performs changes manually.

Required exercises:

1. Add task label color.
2. Add project sort by updated date.
3. Add validation rule.
4. Add one API integration test.
5. Intentionally break CI and diagnose it.
6. Change a Harness pipeline step safely.
7. Add an environment variable end-to-end.
8. Trace one production request from UI to database.

If these cannot be done without asking AI to rewrite the feature, more learning is required.

⸻

135. Demo Scenario

Create a polished demonstration account.

Demo data:

Harness Portfolio Project

Tasks:

✓ Create repository structure
✓ Implement authentication
✓ Add PostgreSQL
✓ Add test suite
✓ Dockerize application
✓ Configure Harness CI
● Configure Harness CD
○ Add production smoke test

A recruiter can immediately understand the product.

Then show:

1. application
2. GitHub PR
3. Harness validation execution
4. Docker artifact
5. Harness deployment
6. production app
7. exact version/commit

This connects product development to delivery.

⸻

136. Failure Demo

A powerful demo is to intentionally show CI preventing bad code.

Example:

Create branch:

demo/broken-test

Change code so one test fails.

Open PR.

Harness:

Lint ✓
Type check ✓
Tests ✗
Build skipped/stopped
Deploy not run

Then fix test/code.

Harness:

Lint ✓
Type check ✓
Tests ✓
Build ✓

This demonstrates why CI exists.

Not merely that Harness has a colorful UI.

⸻

137. Deployment Demo

Merge approved change.

Show:

main
 ↓
release pipeline
 ↓
validation
 ↓
Docker image
 ↓
GAR
 ↓
Cloud Run
 ↓
health check
 ↓
production

Then open production app.

Show version matches commit.

This is the strongest Harness portion of the project.

⸻

138. Interview Walkthrough

The developer should be able to answer:

Product

What does DevTrack do?

Architecture

Why React?
Why Express?
Why PostgreSQL?
Why a modular monolith?

Backend

What happens when I create a task?

Database

How are User, Project, and Task related?

Auth

How is a request authenticated?
How do you prevent one user reading another user's project?

Testing

What do unit, integration, and E2E tests each cover?

Docker

What is the difference between an image and a container?

CI

What happens when you open a Pull Request?

CD

What happens after merge to main?

Harness

What are pipeline, stage, step, connector, secret, service, and environment?

Deployment

Why Cloud Run instead of Kubernetes?

Failures

What happens if tests fail?
What happens if migration fails?

Trade-offs

What would you change if the product needed 100 engineers or millions of users?

⸻

139. Resume Positioning

Do NOT write:

“Made a task manager using React.”

Too weak.

Do NOT write:

“Used 15 technologies including Kubernetes, Kafka, Redis, AI, AWS, GCP...”

if they were unnecessary.

After the system is complete, bullets can resemble:

Built a full-stack project management application using React, TypeScript, Express and PostgreSQL, with modular backend boundaries, authenticated user-owned data, validated REST APIs and automated integration testing.

Containerized the application with a reproducible multi-stage Docker build and designed a Harness CI pipeline that validates pull requests through linting, type checking, automated tests and production builds.

Implemented a Harness release pipeline that builds immutable commit-tagged container artifacts, publishes them to Google Artifact Registry and deploys validated releases to Google Cloud Run using centrally managed secrets.

Designed end-to-end delivery traceability linking Git commits, Harness executions, Docker artifacts and deployed application versions, with post-deployment health checks and documented failure behavior.

Replace broad claims with actual measured facts when available.

Example:

“Reduced build time by X%”

only if actually measured.

⸻

140. What Makes This Project Actually Impressive

The impressive part is not:

React
Express
Postgres
Docker
Harness
Cloud Run

Those are tools.

The engineering is:

                    USER ACTION
                        │
                        ▼
                  CLEAN FRONTEND
                        │
                        ▼
                    TYPED API
                        │
                        ▼
               VALIDATED BACKEND
                        │
                        ▼
                 BUSINESS LOGIC
                        │
                        ▼
                CONTROLLED DATA
                        │
                        ▼
                     TESTS
                        │
                        ▼
                    GIT CHANGE
                        │
                        ▼
                  HARNESS CI
                        │
                        ▼
                VERSIONED IMAGE
                        │
                        ▼
                  HARNESS CD
                        │
                        ▼
                 CLOUD DEPLOY
                        │
                        ▼
                  HEALTH CHECK

That is the project.

The goal is showing that you understand the path from an idea to safely running software.

⸻

141. The One-Sentence Pitch

If someone asks:

“What did you build?”

Answer:

“I built DevTrack, a full-stack project management application with a production-style software delivery workflow: the application uses React, TypeScript, Express and PostgreSQL, while Harness automatically validates pull requests, builds versioned Docker artifacts, manages deployment secrets and deploys approved releases to Cloud Run.”

That is more useful than:

“I made a CRUD app.”

and more honest than pretending it is a giant distributed system.

⸻

142. Definition of Done

The project is NOT finished because:

“AI generated the files.”

It is finished when:

Functional

* registration works
* login/logout works
* projects work
* tasks work
* search/filter work
* dashboard works
* ownership is enforced
* app works locally
* app works in production

Architecture

* frontend structure is consistent
* backend modules are consistent
* controllers are thin
* services contain use cases
* repositories own database access
* validation is centralized at boundaries
* API client is not duplicated
* configuration is centralized
* no random misc dumping ground exists

Quality

* TypeScript strict passes
* ESLint passes
* tests pass
* production build passes
* meaningful coverage target is met
* critical auth/ownership tests exist

Docker

* clean production image builds
* container runs successfully
* local database setup is reproducible

Harness

* PR pipeline runs automatically
* failing checks fail the PR pipeline
* release pipeline builds an immutable image
* artifact is pushed
* production deployment works
* secrets are not stored in Git
* health smoke test runs

Documentation

* README
* ARCHITECTURE
* API
* DATABASE
* HARNESS
* DESIGN_DECISIONS
* WALKTHROUGH
* STUDY_GUIDE

Learning

The developer can:

* implement a small feature manually
* add a validation rule manually
* add a test manually
* explain one request end-to-end
* explain one deployment end-to-end
* diagnose a failed CI step
* explain why each major dependency exists

That last section is mandatory.

⸻

143. Final Recommended Scope

MUST HAVE

✓ React
✓ TypeScript
✓ Vite
✓ Express
✓ REST
✓ PostgreSQL
✓ Prisma
✓ authentication
✓ authorization
✓ Zod validation
✓ standard errors
✓ structured logging
✓ projects
✓ tasks
✓ dashboard
✓ search
✓ filters
✓ Docker
✓ Git
✓ GitHub
✓ tests
✓ Harness PR CI
✓ Harness release pipeline
✓ Harness secrets
✓ immutable Docker artifact
✓ Artifact Registry
✓ Cloud Run deployment
✓ smoke check
✓ detailed documentation

SHOULD HAVE

○ request IDs
○ production version endpoint
○ development seed
○ test coverage reporting
○ PR template
○ staging environment
○ production approval
○ artifact promotion

DO NOT HAVE YET

✗ Kubernetes
✗ microservices
✗ Redis
✗ Kafka
✗ Terraform
✗ GraphQL
✗ WebSockets
✗ multi-tenant organizations
✗ complex RBAC
✗ payments
✗ AI features
✗ mobile app
✗ large observability platform
✗ enterprise architecture for its own sake

⸻

144. Final Product

The finished system should feel like:

                     DEVTRACK

      ┌─────────────────────────────────┐
      │ Dashboard                       │
      │                                 │
      │ Projects  4   Open Tasks  13    │
      │ Done     27   Progress      68% │
      └────────────────┬────────────────┘
                       │
                       ▼
      ┌─────────────────────────────────┐
      │ Harness Project                 │
      │                                 │
      │ TODO     IN PROGRESS      DONE  │
      │ Task A   Task C           Task F│
      │ Task B   Task D           Task G│
      └────────────────┬────────────────┘
                       │
                       ▼
                    REST API
                       │
                       ▼
               ┌───────────────┐
               │    Express    │
               │   Services    │
               │ Repositories  │
               └───────┬───────┘
                       │
                       ▼
                  PostgreSQL


Development and delivery:

                DEVELOPER
                    │
                    ▼
                  GIT
                    │
                    ▼
                 GITHUB
                    │
                    ▼
            HARNESS PR PIPELINE
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
        LINT      TYPES       TESTS
          │         │          │
          └─────────┼──────────┘
                    ▼
                  BUILD
                    │
             merge to main
                    │
                    ▼
          HARNESS RELEASE PIPELINE
                    │
                    ▼
              DOCKER IMAGE
                    │
                    ▼
           ARTIFACT REGISTRY
                    │
                    ▼
              HARNESS DEPLOY
                    │
                    ▼
               CLOUD RUN
                    │
                    ▼
               HEALTH CHECK
                    │
                    ▼
                PRODUCTION

That is the project I would green-light.

The application is intentionally understandable.

The delivery pipeline is intentionally real.

The repository is intentionally structured.

The developer should be able to change any normal feature without regenerating the entire application.

If an AI coding agent is doing a large amount of implementation, that is acceptable.

The bar is:

Every major subsystem must actually work.

Every major subsystem must have a reason to exist.

Every important behavior must be testable.

Every important flow must be documented.

And the person putting the project on their CV must be able to explain it without the AI sitting beside them.

⸻

145. Harness Implementation Notes

Harness terminology in this specification should be checked against the exact features available in the developer's Harness account while implementing.

As of October 2026, official Harness documentation describes:

* CI pipelines as workflows made from stages and steps that can clone a Git codebase, build/test code, and produce/push artifacts.
* code repository connectors for supplying the pipeline codebase.
* triggers for automatic pipeline execution on events such as repository changes.
* Harness Cloud and self-managed build infrastructure options.
* built-in secret management and integrations with external secret managers.
* CD deployment stages based around services, environments, infrastructure definitions, and deployment targets.
* Google Cloud Run as a supported Google Cloud deployment target for containerized applications.

Official references:

Harness CI pipeline creation overview:
https://developer.harness.io/docs/continuous-integration/use-ci/prep-ci-pipeline-components/

Harness pipeline stages:
https://developer.harness.io/docs/platform/pipelines/add-a-stage/

Harness secrets:
https://developer.harness.io/docs/platform/secrets/secrets-management/custom-secret-manager

Harness Continuous Delivery onboarding:
https://developer.harness.io/docs/continuous-delivery/cd-onboarding/certification/onboarding-guide

Harness Google Cloud deployment documentation:
https://developer.harness.io/docs/category/google-cloud-platform/

Do not blindly copy old Harness screenshots or YAML from random tutorials.

Use the current official documentation while configuring the real account.

The architecture of this project should remain stable even if the exact Harness UI changes.
