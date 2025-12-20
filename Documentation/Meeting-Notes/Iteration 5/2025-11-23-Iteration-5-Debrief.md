# Meeting: Stakeholder Iteration 5 Debrief

**Date:** 2025-11-19  
**Time:** 18:00-18:45  
**Attendees:** Minh, Steven, David, Adib, Omar, Youssef, Younes  
**Absent:** /  
**Note Taker:** Minh

## Summary
The meeting focused on the transition from Iteration 5 to Iteration 6. While progress was made on the Montreal Lot Scraper and GCS bucket segregation, the Cloud Run deployment (Epic 13) remains incomplete.

The immediate directive for Iteration 6 is to prioritize the Cloud Run deployment above all else, with a **strict deadline set for Wednesday.**

New governance procedures were established regarding risk mitigation tracking in Pull Requests (PRs) and architectural ownership. Future priorities were mapped for both Scraping and Parsing teams following the completion of the cloud deployment.

### **Action Items**

| Task | Doer | Status |
| :--- | :--- | :--- |
| Complete Cloud Run deployment (Scrape/Parse end-to-end). | Dev Team | |
| Document machine configuration in README and transmit to `stakeholder-general`. | Dev Team | |
| Execute parallel load tests (5-10 tasks) to benchmark cost scaling. | Dev Team | |
| Finalize PR for US 14.1. | Youssef | |
| Reorganize architecture to remove stakeholder dependencies. | Omar | |
| Implement formal risk audit protocols in PR reviews. | Minh |x |

## Agenda

### **1.0 Current Status & Completed Work (Iteration 5)**

*   **Infrastructure:** GCS buckets have been created. The Omar has enforced a policy where different municipalities must upload to segregated buckets.
*   **Montreal Lot Scraper (Epic 11):** Refactoring is complete and ready for review.
*   **Cloud Deployment (Epic 13):** Deployment to Cloud Run is **not done** due to resource unavailability.
*   **US 14.2:** Tests are passing, Younes to PR ASAP.
*   **US 14.1:** Work is ongoing; Youssef is expected to open a PR shortly.

### **2.0 Plan for Next Iteration (Iteration 6)**

*   **Primary Priority:** The sole focus is functional deployment to Cloud Run. No other tasks are to be prioritized until this is achieved.
*   **Deadline:** Wednesday.
*   **Definition of Done (DoD):**
    1.  **End-to-End Execution:** Successfully deploy a full run (Scraping triggered via scheduled task; Parsing triggered via upload event).
    2.  **Documentation:** Machine configuration must be recorded in a README and sent to the stakeholder.
    3.  **Cost Analysis:** Run parallel tasks (5-10 instances) and record usage metrics to project cost scaling.

### **3.0 Future Priorities (Post-Iteration 6)**

Once Cloud Run deployment is confirmed, teams will shift focus to the following ordered priorities:

*   **Parsing Team:**
    1.  **Data Lineage:** Implement tracing of a parsed object back to its source page/section via `structureNode`.
    2.  **Dead Letter Queue (DLQ):** Implement error handling queue.
*   **Scraping Team:**
    1.  **Compliance Documentation:** Rewrite architecture and compliance statements.
    2.  **Montreal Lot Scraper:** Finalize for stakeholder approval.
    3.  **Operations Scaling:** Analyze performance and costs for scraping 10+ years of historical data; consult stakeholder for cost acceptance criteria.

### **4.0 Governance, Architecture & Compliance**

*   **Risk Mitigation Procedures:**
    *   To address academic/legal concerns, all new User Stories must cite specific risks by name (e.g., R01).
    *   **PR Requirements:** Every PR must formally address how the cited risks were mitigated. For instance.
        *   **Scraping (R04):** Must record `robots.txt` and Terms of Service (ToS) for target sites.
        *   **Parsing (R05):** Must record how PII was sanitized.
    *   **Audit:** Minh and QA will perform a formal compliance audit during the PR review process.
    *   **Documentation:** PR and US templates will be updated to reflect these new requirements.
*   **Architecture Ownership:** Architectural organization will be refactored to decouple stakeholder components. Ownership of the scraping architecture is assigned to Omar.
*   **Legal & Licensing:**
    *   **PyMuPDF License:** Still pending.
    *   **Captcha/Bypassing:** Confirmed that no code exists to bypass captchas. Naming conventions have been updated by Steven to reflect strict legal compliance.