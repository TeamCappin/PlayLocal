# IAM Module

Creates two service accounts and grants least-privilege access on the storage buckets:

- **DecompositionService** (`decomposition-service-sa`)
  - `roles/storage.objectAdmin` on `raw-work-units`
  - `roles/storage.objectAdmin` on `raw-documents` (optional if name provided)

- **ParserService** (`parser-service-sa`)
  - `roles/storage.objectViewer` on `raw-work-units`
  - `roles/storage.objectAdmin` on `parsed-objects`

> This module uses `google_storage_bucket_iam_binding`, which **manages the entire member list** for a role on a bucket.  
> If other tools/teams also add members to the same role outside Terraform, consider switching these to
> `google_storage_bucket_iam_member` resources to be additive instead of authoritative.
