# Meeting: Stakeholder Iteration 4 Debrief

**Date:** 2025-11-19  
**Time:** 16:00-17:00  
**Attendees:** Minh, Dominic-Munera, Clement-Munera, Francis-Munera
**Absent:** /  
**Note Taker:** Minh

## Summary
The primary objectives of the meeting were achieved: the stakeholder expressed satisfaction with the Iteration 4 demo, the plan for Iteration 5 was approved, and several critical open questions regarding project architecture and data management were resolved.

Key outcomes include the decision to prioritize deployment to GCP Cloud Run, a directive to architect for automated, granular retries using a Dead Letter Queue (DLQ), and clarification on data segregation and retention policies. Sign-off for Iteration 4 deliverables is deferred until they are successfully demonstrated in the shared cloud environment.

### **Action Items**

| Task | Doer | Status |
| :--- | :--- | :--- |
| Prepare and export proposed Cloud Run configurations for stakeholder review. | Dev Team |  |
| Provide current Cloud Run configurations for dev team to use as a reference. | Stakeholder |  |
| Provide outdated AI prompts to dev team for reference. | Stakeholder |  |
| Merge US 7.2 and send to Clement | Minh |  |
| Follow up with Claudia on the status of the EULA and PyMuPDF license. | Stakeholder |  |

## Agenda

### **1.0 Current Status & Completed Work (Iteration 4)**

*   **Demo Feedback:** The stakeholder is happy with the content of the demo video and presentation for Iteration 4.
*   **Sign-Off Deferral:** Sign-off for the Laval Council Scraper (EPIC 13) and the Laval Parser (US 7.1, 7.2, 8.1) is **deferred**.
    *   **Reason:** The stakeholder wants to audit the components when they are running live on the shared GCP Cloud Run environment, as it is easier for all parties to verify.
*   **Document Filtering (US 7.2):** For Montreal, the stakeholder will use the built-in BigQuery AI classification as it performs better, despite being more expensive. The keyword-matching filter developed for Laval will be kept if it is judged to be a sufficiently cheaper and appropriate solution for Laval.

### **2.0 Plan for Next Iteration (Iteration 5)**

*   **Primary Priority:** The main focus for the upcoming iteration is deploying the system to GCP Cloud Run. The stakeholder anticipates issues during the initial cloud deployment.
*   **De-scoped Work:** Work on the Donnees Quebec data source (EPIC 9) is shelved for now.
*   **New Requirements:**
    *   **Admin View (US 10.3):** An internal admin portal to visually compare `RawDocument` and `ParsedObject` is required.
        *   It must have a **completely separate backend** and must **never** be shown in the customer-facing view to protect their competitive advantage.
        *   The backend should be built in **Firebase/Firestore**, not Django.
    *   **Retry Logic (US 14.2):** The current manual batch launch that re-runs a full document is inefficient. The architecture must be refactored to support **automated, granular retries per work-unit**.
    *   **Dead Letter Queue:** A DLQ is required for failed work-units. It must log the **real error codes**, not custom statuses.
*   **Architectural & Operational Requirements:**
    *   **Deployment Configuration:** The stakeholder must be provided with the exact configurations and number of instances for review before any large-scale deployment. They will provide their current Cloud Run configurations as a reference.
    *   **Data Schema:** The architecture must be refactored to fit the metadata schema they have in BigQuery.
    *   **Data Lineage:** As a "nice to have," the team should check if a `ParsedObject` can be traced back to its corresponding page in the `RawDocument`. This would enable cheaper DB join queries (e.g., "find all past decisions done on this dossier") and avoid their expensive legacy AI-based querying.
*   **Stakeholder Support:** The stakeholder will provide their outdated AI prompts for reference. While being refactored into LangChain on their end, they can provide insight into their previous logic.

### **3.0 Clarifications on Open Questions**

*   **Data Segregation:**
    *   **Raw Documents:** Use **separate physical buckets per municipality**. The stakeholder's reasoning is that users are unlikely to view documents from different municipalities at the same time and the schemas can differ.
    *   **Processed Data:** Use **one single BigQuery bucket** for all parsed objects. Logical separation (e.g., via a flag) is the preferred method here.
    *   **Presentation Layer:** A **unified schema is required for the "showing" layer**, even if underlying storage differs. The team must follow up with Clement for this schema.
*   **Stakeholder/Tenant Data:** Duplicating stakeholder information per municipality is acceptable. The stakeholder wants to avoid creating a unified stakeholder table because it's difficult and not worth it; most stakeholders are discovered per municipality, and clients are unlikely to look at cross-municipality data.
*   **Data Retention Policy:** The policy is **infinite retention** whether or not the `RawDocument` is relevant. The stakeholder stated that "storage is not the expensive part." Rescraping a wrongly deleted document is more costly than storing it.
*   **Data Quality Validation:** This is currently done by hand on the stakeholder's side. Future AI evaluation using Google services is planned but is not in the project's scope.
*   **Data Lineage Auditing:** This is a requirement. The stakeholder uses dbt, so the system must provide the necessary metadata to support it.
*   **Incident Response Contact:** The designated contact is Dominic.
*   **Acceptable Use Policy:** This is currently being written by Claudia. The team must follow up with her for details.
*   **Geographic Heatmap Feature:** This feature is **rejected**. The stakeholder's position is that it is not relevant because they take all data a municipality publishes; if that data is biased, "it's not on them."
*   **PyMuPDF License:** The license is still under legal review by Claudia and remains a logged project risk.