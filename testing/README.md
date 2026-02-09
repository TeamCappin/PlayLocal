# Testing

This folder documents how we test PlayLocal and provides a home for shared test assets.
Code-based tests live alongside their apps; this folder is for plans, fixtures, and scripts.

Structure

testing/
  README.md        (this file)
  plans/           Test plans and acceptance checklists
  scripts/         Helper scripts for running tests
  fixtures/        Shared fixtures and seed data snapshots
  reports/         Generated reports (recommend gitignore)
  notes/           Exploratory testing notes

Where tests live today

- Backend: playlocal/backend/src/test/java
- Frontend: playlocal/frontend/test

Quick commands

- Backend unit/integration: (cd playlocal/backend && ./mvnw test)
- Backend concurrency: requires Docker (Testcontainers)
- Frontend: (cd playlocal/frontend && npm test)
