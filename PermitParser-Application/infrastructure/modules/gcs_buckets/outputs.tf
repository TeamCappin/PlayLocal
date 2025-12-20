# Expose names for downstream modules (helpful for IAM)
output "raw_work_units_bucket" {
  description = "Name of the raw-work-units GCS bucket"
  value       = google_storage_bucket.raw_work_units.name
}

output "parsed_objects_bucket" {
  description = "Name of the parsed-objects GCS bucket"
  value       = google_storage_bucket.parsed_objects.name
}

output "raw_documents_bucket" {
  description = "Name of the raw-documents GCS bucket"
  value       = google_storage_bucket.raw_documents.name
}
