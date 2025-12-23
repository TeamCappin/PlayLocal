# Release & Demo Plan (Video + Tagging + Release Notes)

This document explains how we:
1) prepare a stable version to demo,
2) record a demo video,
3) tag a version in GitHub,
4) publish release notes.

---

## Some definitions
- **Tag**: a label on a specific commit (example: `v1.0.0`). It “freezes” a version.
- **GitHub Release**: a page in GitHub that references a tag + includes release notes + demo links.
- **Milestone**: a GitHub grouping of issues for an entire release.

---

## GitHub Release Steps
1. Work happens on `feature/*` branches → PR into `dev`.
2. When `dev` looks stable, open a PR: `dev` → `main`.
3. Deploy **Staging manually** from `main` for demos/final checks.
4. Record the demo video using the **Staging environment** to ensure stability and clean data.
5. Create a version tag on `main` (e.g., `v0.1.0`). This tag marks the exact release version (and will trigger Production publishing once CI is set up).
6. Create a **GitHub Release** that points to that tag and includes release notes + the demo video link.


---

## Versioning & tagging
We use version tags in the format:
- Format: `vX.Y.Z` (example: `v0.1.0`)
  - **X (major)**: breaking change. Example: you switch from “simple login” to “OAuth only”. Old login flow no longer works.
  - **Y (minor)**: adds new features without breaking existing ones (example: adding “report user” while game creation still works the same).
  - **Z (patch)**: small fixes and improvements (example: fixing a crash, typo, or validation bug).

**Rule:** tags are created from `main` only.

---

## Demo video plan
### Goal
Show the main MVP flow end-to-end clearly.

### Recording source
Use **Staging** (not Dev) to avoid unexpected changes and messy data.

### Suggested length
5–10 minutes.

### Suggested demo script
1. Quick intro: what PlayLocal is solving
2. Create account
3. Create / browse a game (sport, time, location)
4. RSVP as a player
5. Organizer views participants
6. Post-game flow: confirm attendance (mark no-shows)
7. Reliability score updated
8. Show reliability impact (or where it will be shown)
9. Safety: report issue button + what happens next
10. Wrap-up: what’s included in this release

### Video checklist (before recording)
- Staging is deployed from the correct `main` commit
- Data looks clean (test accounts ready)
- Prepare 2–3 test users in advance or more, depending on the features shown
- You know exactly which screens you’ll show
- Good screen recording quality, we can read what's actually displayed
- Make sure your audio is on

---

## Release notes plan (GitHub Release)
### What goes into release notes
- Short summary of what changed in this release
- Key features delivered
- Fixes / improvements
- Tech/Infra changes
- Known limitations
- Link to demo video
- List of issues closed in the release milestone along with their respective contributors

### Release notes template
**Summary**
- 1–3 sentences on what this release adds.

**Highlights**
- **Features:** (list of the features implemented)
- **Fixes/Improvements:** (list important bug fixes / UX improvements)
- **Tech/Infra:** list important internal changes that aren’t visible as “features” but still matter (e.g., set up CI so tests run automatically)

**Known Limitations**
- Anything incomplete or intentionally out of scope.

**Demo**
- Video demo
- Staging URL (if public/team-accessible)

**Issues completed (Release milestone)**
- List of issues completed along with their respective contributors for the entire release

---

## Definition of Done (for a release)
- Staging deployed from `main`
- Demo video recorded and linked
- Tag created on `main` (e.g., `v0.1.0`)
- Production published from that tag (automatically via CI if set up, otherwise manually)
- GitHub Release published with notes + links
- Release milestone closed
