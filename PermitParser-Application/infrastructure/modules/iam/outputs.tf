output "decomposition_service_account_email" {
  description = "Email of the DecompositionService service account"
  value       = google_service_account.decomposition_service.email
}

output "parser_service_account_email" {
  description = "Email of the ParserService service account"
  value       = google_service_account.parser_service.email
}

output "decomposition_service_account_id" {
  description = "Resource ID of the DecompositionService service account"
  value       = google_service_account.decomposition_service.id
}

output "parser_service_account_id" {
  description = "Resource ID of the ParserService service account"
  value       = google_service_account.parser_service.id
}

output "iam_bindings_ids" {
  value = {
    raw_work_units_decomposition = google_storage_bucket_iam_binding.raw_work_units_decomposition.id
    raw_work_units_parser        = google_storage_bucket_iam_binding.raw_work_units_parser.id
    parsed_objects_parser        = google_storage_bucket_iam_binding.parsed_objects_parser.id
    raw_documents_decomposition  = try(google_storage_bucket_iam_binding.raw_documents_decomposition[0].id, null)
  }
}

