# NOTE: No provider block here—this module inherits the root provider.

# ---- Service Accounts ----
resource "google_service_account" "decomposition_service" {
  account_id   = "decomposition-service-sa-${var.environment}"
  display_name = "Decomposition Service Account"
  description  = "Access to raw-work-units (and raw-documents if provided)."
}

resource "google_service_account" "parser_service" {
  account_id   = "parser-service-sa-${var.environment}"
  display_name = "Parser Service Account"
  description  = "Read raw-work-units, write parsed-objects."
}


# ---- IAM Bindings ----
# Decomposition → raw-work-units: write/admin on objects
resource "google_storage_bucket_iam_binding" "raw_work_units_decomposition" {
  bucket = var.raw_work_units_bucket_name
  role   = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:${google_service_account.decomposition_service.email}",
  ]
}

# Parser → raw-work-units: read
resource "google_storage_bucket_iam_binding" "raw_work_units_parser" {
  bucket = var.raw_work_units_bucket_name
  role   = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${google_service_account.parser_service.email}",
  ]
}

# Parser → parsed-objects: write on objects
resource "google_storage_bucket_iam_binding" "parsed_objects_parser" {
  bucket = var.parsed_objects_bucket_name
  role   = "roles/storage.objectCreator"
  members = [
    "serviceAccount:${google_service_account.parser_service.email}",
  ]
}

# OPTIONAL: Decomposition → raw-documents: write/admin on objects (only if provided)
resource "google_storage_bucket_iam_binding" "raw_documents_decomposition" {
  count  = length(var.raw_documents_bucket_name) > 0 ? 1 : 0
  bucket = var.raw_documents_bucket_name
  role   = "roles/storage.objectAdmin"
  members = [
    "serviceAccount:${google_service_account.decomposition_service.email}",
  ]
}
