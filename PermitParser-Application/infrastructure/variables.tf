variable "project_id" {
  description = "Google Cloud Project ID (e.g., munera-permitparser-dev)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_id))
    error_message = "project_id must be lowercase letters, numbers, and dashes only."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "region" {
  description = "GCP region/location (match Cloud Run region when possible)"
  type        = string
  default     = "northamerica-northeast1"
}

# Optional: only if you also have a separate raw-documents bucket managed elsewhere
variable "raw_documents_bucket_name" {
  description = "If provided, DecompositionService will get objectAdmin on this bucket too"
  type        = string
  default     = ""
}

# Convenience: allow force-destroy in non-prod (overrides per env if you want)
variable "force_destroy_override" {
  description = "Set true to force-destroy buckets even if they contain objects (useful in dev)"
  type        = bool
  default     = null
}
