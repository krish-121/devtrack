# DevTrack AI Development Instructions

## Source of truth

Read `docs/PROJECT_SPEC.md` before making architectural,
feature, infrastructure, testing, or deployment decisions.

`docs/PROJECT_SPEC.md` is the primary engineering specification.

If a task prompt appears to conflict with the specification,
stop and identify the conflict instead of silently changing the architecture.

## Project objective

DevTrack is a learning-focused full-stack portfolio project.

AI may implement a large percentage of the code, but the final codebase
must remain readable, maintainable, testable, professionally structured,
and understandable by a beginner who is actively learning it.

## Architecture rules

- Follow the architecture and V1 scope defined in PROJECT_SPEC.md.
- Do not increase V1 scope without explicit approval.
- Do not introduce technologies merely because they are popular.
- Prefer explicit, readable implementations over clever abstractions.
- Preserve existing naming and architectural conventions.
- Do not create duplicate API clients, schemas, DTOs, helpers,
  state-management approaches, services, or validation systems.
- Keep frontend and backend responsibilities separated.
- Backend features should follow:
  route → validation → controller → service → repository → database
  where appropriate.
- Controllers should remain thin.
- Business logic belongs in services.
- Prisma/database access should normally remain in repositories.
- Use strict TypeScript.
- Avoid `any`, unsafe casts, suppressed errors, and unnecessary abstractions.
- Do not perform unrelated refactors.
- Never commit secrets.
- Do not silently replace technology choices from PROJECT_SPEC.md.

## Before implementation

For every significant task:

1. Read the relevant sections of PROJECT_SPEC.md.
2. Inspect the existing repository before changing it.
3. Explain what already exists that relates to the task.
4. State exactly what will change.
5. State what will deliberately NOT change.
6. Reuse existing architecture instead of creating parallel solutions.

## After implementation

1. Format affected files.
2. Run lint.
3. Run TypeScript type checking.
4. Run relevant tests.
5. Run the build when appropriate.
6. Fix problems caused by the change.
7. Review the diff against PROJECT_SPEC.md.

Report:

- files created
- files modified
- important implementation decisions
- tests added/changed
- commands executed
- failures or unresolved issues
- concepts I should understand
- suggested Git commit message

Do not begin another feature after completing the requested scope.