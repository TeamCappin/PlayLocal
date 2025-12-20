// TTL is fixed by policy to 90 days, do not convert to a variable.
// Names are built as <project-id>-<env>-<purpose> to keep things consistent.
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
  description = "GCS region (match Cloud Run region when possible)"
  type        = string
  default     = "northamerica-northeast1"
}

variable "force_destroy" {
  description = "Allow bucket deletion even if it contains objects (handy in dev; keep false in prod)."
  type        = bool
  default     = false
}