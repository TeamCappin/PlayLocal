variable "project_id" {
  description = "Google Cloud Project ID (e.g., munera-permitparser-dev)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_id))
    error_message = "project_id must be lowercase letters, numbers, and dashes only."
  }
}

variable "region" {
  description = "GCS region (match Cloud Run region when possible)"
  type        = string
  default     = "northamerica-northeast1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "raw_work_units_bucket_name" {
  description = "Existing raw-work-units bucket name"
  type        = string
}

variable "parsed_objects_bucket_name" {
  description = "Existing parsed-objects bucket name"
  type        = string
}

variable "raw_documents_bucket_name" {
  description = "OPTIONAL: existing raw-documents bucket name (if you have one)"
  type        = string
  default     = ""
}
