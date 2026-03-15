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
