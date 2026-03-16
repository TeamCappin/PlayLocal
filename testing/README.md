# Testing

This folder documents shared testing artifacts for PlayLocal.
Code-based test suites live in the backend and frontend apps.

## Current structure

- `testing/README.md` (this file)

## Where tests live today

- Backend: `playlocal/backend/src/test/java`
- Frontend: `playlocal/frontend/test`

## Quick commands

- Backend unit/integration: `cd playlocal/backend && ./mvnw test`
- Frontend: `cd playlocal/frontend && npm test`

Performance validation lives in `performance/` at the repo root — see `performance/README.md`.
- Backend unit/integration: (cd playlocal/backend && ./mvnw test)
- Backend concurrency: requires Docker (Testcontainers)
- Frontend: (cd playlocal/frontend && npm test)

CI checks

- Docker image build on PRs: `.github/workflows/docker-build-pr.yml` builds the backend and frontend images to catch container regressions early.
