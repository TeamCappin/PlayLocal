# Meeting: Project Kickoff Discussion

**Date:** 2025-09-21
**Time:** 
**Attendees:** Team
**Absent:** Minh 
**Note Taker:** Asif

## Summary

Project kickoff meeting covering team introductions, task assignments, and project requirements discussion.

Reference documents: 
 -[Kickoff Checklist](https://docs.google.com/document/d/1JyGRybV-TeF5ontga2NT2xIzLY0q01ybgl512atiNM8/edit?tab=t.0)
 -[Initial Architecture Proposal by David](./Phase1Proposal_David.pdf)
 -[User Stories by Hudson](https://docs.google.com/document/d/1GUlMApbiNgSPtQUzfz4SwM-HoRoEPigYiufBtjmZ1cw/edit?tab=t.vk4tcvw0q8cs)


## Discussion Points

### Project Requirements

1. The only requirement is that "there is substantial engineering design and implementation work" in the project proposal. Ideally the project is also novel.
2. Work on the project will begin by Sept 15th latest. *Iteration 1 is due Sept 29th*.
3. Decide on a software license. MIT license is recommended.

### Team Qualifications

- Adib: Implementation
- Alexander: Parsing, software dev, machine learning
- Allaye: Scripting, web dev (front, back)
- Asif: Data analysis, AI project, parsing
- David: Data analysis internship, AI course, computer vision, scripting
- Hudson: Parsing, data analysis, testing
- Omar: Back-end, front-end, deep learning, AZURE AWS
- Younes: Scraping, parsing, QA, prefers development this time
- Youssef: Experience with parsing projects, AI not strong point

### Sprint Requirements for September 29th

- Fix Wiki, add README
- Branches should be deleted after merging (too many branches)
- When merging branches, automatically delete merged branches
- Started splitting tasks for 1st delivery due September 29th
- Need to confirm requirements with professor

### User Stories and Team Division

- Went over Hudson's User stories document
- Divide teams (Completed)
- Team should confirm all tasks are done by tomorrow or Tuesday

### Technical Questions and Clarifications

- Q: Is it one-time scraping and then we parse? 
    A: No, it is live. We need more technical meeting for this.
    If we could know how Munera did it for Montreal, we could adopt it to other cities.
    - Todo: Get more technical details from Munera - talk to Minh about it
- Q: What websites to scrape? What to look for in websites?
- Q: Do we need an API or more of a CLI tool? 
    A: Not needed for MVP, maybe later.

### Technology Stack

- Language: Python
- Cloud Platform: GCP (stakeholder using)
- Parsing: Operation or parsing wouldn't need a server
- Storage: Cloud SQL, Postgres
- Automated scrapers required
- Create sterilized script and push to server end
- Set a deadline for Thursday
- Start working on diagrams, update as we go

## Team Structure

### PM:
- Minh

### Scraping (3 people):
- Adib
- Steven
- Omar

### Parsing (6 people):
- Alexander
- Asif
- David
- Melissa
- Younes
- Youssef

### Infrastructure + QA (2 people):
- Hudson (parsing)
- Allaye

## Action Items

| Task | Doer | Status |
| --- | ---: | --- |
| Get more technical details from Munera | Minh |  |
| Fix Wiki, add README | Adib, Minh |  |
| Confirm requirements with professor | Team |  |
| Start working on diagrams | Team |  |
| Set up automated branch deletion | Adib |  | 

