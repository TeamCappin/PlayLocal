# Meeting: Weekly Meeting

**Date:** 2025-10-12  
**Time:** TBD  
**Attendees:** Adib, Alexander, Allaye, Asif, David, Hudson, Melissa, Omar, Youssef  
**Absent:** Minh, Steven, Younes  
**Note Taker:** Allaye

## Summary
Quick sync about GCP access/permissions, deployment readiness, scraping progress, and plans for the next iteration. Main blockers are access/permissions on GCP and missing secrets/connection strings for deployments.

## Discussion Points

### GCP Access and Permissions

- **Urgent:** Contact stakeholder to grant access/permissions on GCP (private container registry, Cloud Run, IAM roles).
- Omar needs access and a private container on GCP to upload images and deploy on Cloud Run.
- Currently everyone is using a shared user account. Need to create a hierarchy of users with different permissions and access levels on GCP.

### Development Progress

- **David:** Core implementation mostly complete; needs access to deploy to Cloud Run.
- **Asif:** Raised concerns about a substantial design component (large scope). Same deployment/access needs apply for Asif and Melissa (6.2).
- **Allaye:** Pairing with Hudson on related work.
- **Adib:** Laval scraper finished.
- **Omar:** Need to create a database (design and provisioning).

### Technical Considerations

- **CI/CD blockers:** Missing connection strings and secrets in containers/GitHub Actions necessary for deployment.
- **Reinforcement learning:** Possible direction but expensive and likely overscoped for current iteration — could be explored as a learning exercise.

### Decisions Made

- Do not pursue a full RL solution in the immediate iteration (flag as possible future work).
- Prioritize provisioning correct GCP accounts/permissions and getting secrets into CI for deployment.
- Start small with iterative decomposition for each service (build logic per service and test pipeline with real documents once stakeholder access is available).

### Plan for Next Iteration

**Adib:**
- Try to upload data to GCP.
- Create local tooling to run GCP-related services locally (emulation/dev tools).
- Scrape additional websites/cities as available (expand scraper coverage).
- Test and define the data pipeline, especially containerization and how it will run in CI/CD.

**David:**
- Continue work on core processing logic.
- Run the pipeline end-to-end with an actual document once stakeholder access is arranged.
- For each service, decompose tasks and implement iteratively; start with the minimum viable pieces.

**Allaye:**
- Draft a proposal for the UI (initial wireframes/feature list).
- Collaborate with Hudson as needed.

**Omar:**
- Request/coordinate GCP access and private container provisioning.
- Begin database schema design and provisioning plan.

**Asif & Melissa:**
- Coordinate on 6.2 deployment and access needs.
- Address design concerns raised by Asif and align with implementation plan.

**Everyone:**
- Attend the next full meeting with stakeholder present if possible.

## Action Items

| Task | Doer | Status |
| --- | ---: | --- |
| Request GCP access, private container registry, and required IAM roles | Omar | TODO |
| Prepare deployment checklist and requirements for Cloud Run (list of secrets, env vars) | David | TODO |
| Upload sample data to GCP and provide local tooling instructions | Adib | TODO |
| Draft initial UI proposal and share for feedback | Allaye & Hudson | TODO |
| Clarify design requirements and scope for "6.2" | Asif & Melissa | TODO |
| Add connection strings and secrets to GitHub Actions (once access approved) | Project | Blocked (waiting on stakeholder/secrets) |
| Decide user account hierarchy and roles for GCP | Project | TODO (coordinate with stakeholder) |
| Design and provision database | Project | TODO |

### Risks and Concerns

- Deployment blocked until stakeholder grants access and secrets are added to CI.
- Shared user account is a security and audit risk; needs rework to per-person or role-based accounts.
- Reinforcement learning approach is expensive and high-risk for the current scope.

### Next Steps

- Schedule a meeting with the stakeholder to:
  - Provision GCP accounts/permissions.
  - Clarify which secrets/connection strings are required and how to provision them for CI.
  - Confirm priority and scope for the next iteration.
- All team members to join the stakeholder meeting.

