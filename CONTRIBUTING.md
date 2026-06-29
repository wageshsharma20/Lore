# Contributing to Lore

Welcome to the Lore repository! We follow strict engineering disciplines to ensure a high-quality codebase.

## Commit Conventions

We use Conventional Commits. Every commit message must be prefixed with one of the following tags:

- `feat:` A new feature
- `fix:` A bug fix
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools/libraries
- `docs:` Documentation only changes
- `refactor:` A code change that neither fixes a bug nor adds a feature

### Examples:
- `feat: add dual-deployment cognee client wrapper`
- `fix: resolve auth router structured error formatting`
- `test: mock cognee client for github actions`

## Submitting Pull Requests
- Ensure all tests pass (`pytest`) before requesting review.
- Provide a clear, detailed PR description.
- All code must route memory operations through `cognee_client.py`.
