# Meeting: Iteration 2 stakeholder signoff

**Date:** 2025-10-13  
**Time:** 13:00 - 14:00  
**Attendees:** Minh, Adib, David, Omar, Dominic Munera
**Absent:** 
**Note Taker:** Minh

New system architecture: https://github.com/TeamCappin/PlayLocal/wiki/System-Architecture

Code for this release: https://github.com/munera-intelligence/PermitParser/releases/tag/v0.2.0-alpha

## Summary

Short debrief after iteration work and stakeholder feedback. Topics covered: parsing approach, scraper progress (Laval), deployment/permissions, and sign-off status.

## Feedback and Discussion

- Stakeholder uses pyulllm to parse documents page-by-page. They noted that most documents likely contain useful information on at least some pages (so whole-document discard is unlikely).
- Stakeholder is happy with the Laval scraper metadata progress. They will send details for "registres fonciers" next to Adib.
- Need to clarify network/port requirements that allow necessary access without granting broad admin permissions.
- Laval's "proces-verbaux" do not include attachments (images, stakeholder info) the same way Montreal's do. To recover that information, a higher-level scraping approach (e.g., querying external sources by address, decision IDs, or case numbers) might be needed — this is out of scope for the current iteration until parsing is stable.
- Reference: list of Quebec real estate developers — https://www.guideimmo.ca/en/index-of-quebec-real-estate-developers/

## Sign-off Status

- Laval scraper: signed off for metadata extraction only.
- System architecture: not yet signed off by stakeholder.

## Parsing Team (David)

Accomplished:
- IAM and Pub/Sub demo/setup that can be presented to the stakeholder.

TODO / Risks:
- Decomposition service, parsing service, and completion-tracker service have been started but are not yet in PR or tested.
- Adapt services to the stakeholder-informed architecture diagram.
- BigQuery setup pending.

Notes:
- David is stepping down as parsing team lead due to limited time. He will coordinate with Minh to identify a replacement. Minh may take over.

## Scraping Team (Adib)

Accomplished:
- Laval scraper is able to retrieve metadata and export it as JSON.

TODO:
- Diagram and document metadata fields.
- Implement downloading of file attachments (not yet coded).
- Omar currently lacks write access to the Docker registry and cannot create GCS blobs; needs IAM changes.
- Stakeholder should provision IAM roles for deployment and registry access.

## Other Notes

- Stakeholder mentioned a potential unrelated paid blockchain project; team to decide if this is allowed or relevant.

## Action Items

| Task | Doer | Status |
| --- | ---: | --- |
| Review and sign off system architecture | Stakeholder / Project | TODO |
| Send registres fonciers details to Adib | Stakeholder | TODO |
| Diagram metadata fields for Laval scraper | Adib | TODO |
| Implement file downloads for scraped documents | Adib | TODO |
| Provision Docker registry write access and GCS blob permissions | Omar / Stakeholder | TODO |
| Complete decomposition & tests for parsing services; open PRs | David | TODO |
| BigQuery setup and dataset provisioning | David / Infra | TODO |
| Identify new parsing team lead and transition plan | David / Minh | TODO |

## Next Steps

- Collect architecture questions from the team and schedule a follow-up with the stakeholder to get final sign-off and IAM provisioning.
- Prioritize the registry/GCS access, BigQuery setup, and parsing service PRs so an end-to-end run can be tested.


