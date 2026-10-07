# DevTrack AI Development Instructions

Read `docs/PROJECT_SPEC.md` before making architectural or feature decisions.

DevTrack is a learning-focused full-stack portfolio project.

The developer is a beginner and AI may write a large part of the implementation, but the code must remain readable, maintainable, testable, and understandable.

## Source of truth

`docs/PROJECT_SPEC.md` is the main engineering specification.

Follow it unless the user explicitly approves a change.

## Architecture rules

- Preserve the architecture defined in the specification.
- Do not increase V1 scope.
- Do not add unnecessary technologies or design patterns.
- Prefer simple, readable implementations.
- Preserve existing naming conventions.
- Do not create duplicate API clients, validation systems, DTOs, helpers, services, or state patterns.
- Backend features should follow route → controller → service → repository → database where appropriate.
- Keep controllers thin.
- Keep business logic in services.
- Keep Prisma/database access in repositories where appropriate.
- Use strict TypeScript.
- Avoid `any` and unsafe casts.
- Do not perform unrelated refactors.
- Never commit secrets.

## Implementation workflow

Before making significant changes:

1. Read the relevant part of `docs/PROJECT_SPEC.md`.
2. Inspect the existing architecture.
3. Modify the existing responsible module rather than creating a parallel implementation.

After changes:

1. Format affected code.
2. Run lint.
3. Run TypeScript type checking.
4. Run relevant tests.
5. Run the build when appropriate.
6. Fix problems caused by the change.

At the end, report:

- files created
- files modified
- architecture decisions
- tests added
- commands run
- failures or remaining issues
- important things the developer should understand
- suggested Git commit message

Do not implement unrelated features.