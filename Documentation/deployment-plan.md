# Deployment Plan (Local / Dev / Staging / Production)

This document explains **where PlayLocal runs** and **how we publish updates**.

## Some definitions

- **Environment**: a “place” where the app runs (your laptop, a team server, a demo server, etc.).
- **Deploy (publish)**: put the latest version of the app into an environment so people can use it.
- **Environment variables**: settings the app reads at runtime (example: `DATABASE_URL` tells the app which database to connect to).
- **Secrets**: env vars that must stay private (passwords, API keys). They should never be committed to GitHub.

---

## Deployment workflow (summary)
1. Create a feature branch from `dev`, then build and test the feature in your **local environment** first.
2. After completing the feature, open a PR to merge the feature branch into `dev`.
3. Merging into `dev` updates the **Dev environment** (via CI once set up).
4. When `dev` is stable, open a PR to merge `dev` into `main`.
5. Deploy **Staging manually** from `main` for demos/final checks to keep the demo environment stable.
6. When ready, create a version tag on `main` (e.g., `v1.0.0`). This is the version we publish to **Production**.

---

## Testing
- **Local:** developers run tests before opening a PR.
- **Dev/Staging/Production:** We plan to run automated checks (build/tests) in CI for merges/tags once the pipeline is set up.

---

## 1) Local (your laptop)
**Who uses it:** each developer  
**Purpose:** fastest way to build and test while coding  
**Where it runs:** your own machine

### You start the app on your own computer. Usually there are two parts:
  - **Frontend** = the website/screens
  - **Backend** = the server/API

  You run both using local commands (will be added after Issue #54 (README build/run commands) is completed).
<br>
<br>
### Your local app uses non-production data.
  When running locally, you should connect to either:
  - a **local database/emulator** on your laptop, **OR**
  - a **shared dev/test database** that is meant for development.

  The goal is to never use the real production/release database from local development.
<br>
<br>
### You keep your settings in a local `.env` file.
  This file lives on your laptop and contains configuration like:
  - which database to connect to
  - backend/frontend URLs
  - secret keys (if any)

  This file should **NOT** be committed to GitHub because it can contain private values.
  > A `.env.example` file will be committed soon and can be used as a template (variable names only). Each developer copies it to `.env` / `.env.local` and fills in their own values locally.
---


## 2) Dev (shared team version)
**Who uses it:** the whole team  
**Purpose:** integration testing (everyone’s code working together)  
**Where it runs:** online (shared URL)

### What it is
- A single shared online copy of the app that the team can access to test features together.
- It updates frequently as features get merged, so it may sometimes be temporarily buggy or unstable (that’s normal for Dev).

### Data (important)
- Dev uses a **Dev database** (non-production).
- This Dev database is used by the deployed Dev app, and **may also be used by developers locally** (optional) for convenience.
- Since many people create/edit test data here, Dev data can get messy, so avoid using Dev for demos/submission when you need something clean and reliable.

### How updates get there
- When code is merged into the `dev` branch, the Dev environment gets updated automatically via CI (once set up).

Dev config (env vars/secrets) will be stored in the hosting platform / GitHub Environments under “dev” (repo settings), not committed in the codebase.

---

## 3) Staging (pre-release / demo rehearsal)
**Who uses it:** the team (and any demo audience, if applicable)  
**Purpose:** stable environment for final checks + demos  
**Where it runs:** online (separate URL)

### What it is
- A “clean” version of the app that we update only when we decide it’s ready to demo/test.
- Should behave as close to Production as possible.

### Data (important)
- Staging uses its **own Staging database** (separate from Dev).
- This prevents dev testing from breaking the demo.

### How updates get there
- We update Staging only when we want to test/demonstrate a stable version (not on every merge).
- When a commit on the `dev` branch is considered stable, we merge it to the `main` branch.
- Then we **manually deploy** Staging from the `main` branch (e.g., clicking “Run workflow” in GitHub Actions) so the demo environment stays controlled and predictable.

Staging config (env vars/secrets) will be stored in the hosting platform / GitHub Environments under “staging” (repo settings), not committed in the codebase.

---

## 4) Production (official version)
**Who uses it:** end users / evaluators  
**Purpose:** official stable version  
**Where it runs:** online (official URL)

### What it is
- The official version we consider stable/final.
- Updated only intentionally (not on every merge).
- Most strict settings (security, rate limits, etc. if applicable).

### Data (important)
- Production uses its **Production database**.
- Local/Dev/Staging should **never** connect to this database.

### How updates get there
- We release only from the `main` branch by creating a **version tag** like `v1.0.0`.
- Creating the tag triggers the GitHub Actions **release pipeline**, which publishes that exact version to Production.
- Using tags lets us clearly identify what was released and roll back to a previous version if needed.

Production config (env vars/secrets) will be stored in the hosting platform / GitHub Environments under “production” (repo settings), not committed in the codebase.

---

## Configuration (Env vars + Secrets)

### What counts as a secret (must be private)
- DB password / DB connection string (if it includes credentials)
- JWT signing key
- OAuth client secrets
- Third-party API keys.

### `.env.example` (recommended)
- The repo will include a **`.env.example`** file that lists all required environment variables (no real secrets).
- Each developer creates their own **`.env` / `.env.local`** locally by copying `.env.example` and filling in values.
- `.env` / `.env.local` must be in `.gitignore` (never committed).

