# Infrastructure Stack

This folder is the **root Terraform module** that wires together:
- `modules/gcs_buckets`: creates GCS buckets + lifecycle (90-day TTL on raw-work-units).
- `modules/iam`: creates service accounts and grants least-privilege IAM on those buckets.

## Parsed Objects Layout (required)

All results written to the parsed-objects bucket **must** use this object name pattern:
**`{projectId}/{documentId}/{filename}`**

**Why**
- Keeps all outputs for a document grouped.
- Easy listing by prefix:  
  `gsutil ls gs://<project>-<env>-parsed-objects/<projectId>/<documentId>/`