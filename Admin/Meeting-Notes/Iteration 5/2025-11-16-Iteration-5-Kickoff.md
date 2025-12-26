# Meeting: Parsing-Team-Iteration-5-Kickoff

**Date:** 2025-11-16  
**Time:** 18:30-19:30  
**Attendees:** Alexander, Asif, David, Melissa, Minh, Youssef, Younes, Adib 
**Absent:** /  
**Note Taker:** Minh

## Summary
Kickoff meeting for Iteration 5 User stories were assigned and key details were clarified to ensure alignment for the upcoming work period.

### Agenda

Reviewed the current status of both pipelines, including completed and ongoing user stories.

### Assigned the US for this iteration:

* Asif, Melissa, Youssef: US 14.1 — As a user, I want the parsing pipeline to be launched when a document is successfully uploaded to GCP.
* Alex, David, Younes: US 14.2 — As a user, I want to retry parsed objects individually with different parsers when necessary.
* Youssef: US 15.1 — As a user, I want to know the original language of a raw document. (optional)
* Omar: EPIC 13 Laval Council Scraper — Make the pipeline work in cloud (US to be written by @adssib)
* Adib, Steven: EPIC 11 Montreal Lot Scraper — Make the pipeline run locally, priority made higher due to stakeholder feedback.


### Smaller tasks

Youssef will refactor his code in US 8.1 to ensure the schema is only in English (to reduce confusion) and add an `original_language` field to `RawDocument`.

David and Alexander will refactor their work on US 7.1 related to the stakeholder pipeline.

Adib to reorganize the Scraping team's User Stories in accordance to new Epic numbering.

### Clarifications

It was confirmed that parsers should be interchangeable, in accordance with the design architecture.

A language detection module will be required soon, with a potential translation feature to be considered in the future.

Work procedures were clarified: the SCRUM team will explicitly assign user stories and expects PR titles to reference user stories. Smaller tasks remain flexible and are at the developers' discretion.