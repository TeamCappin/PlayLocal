locals {
  # project naming convention for buckets:  <project-id>-<env>-<purpose>
  prefix = "${var.project_id}-${var.environment}"
}

# Stores temporary files created right after documents are decomposed, before parsing
resource "google_storage_bucket" "raw_work_units" {
  name          = "${local.prefix}-raw-work-units"
  location      = var.region
  storage_class = "STANDARD"
  uniform_bucket_level_access = true # simpler, bucket-level IAM, helpful for task 107
    
  force_destroy = false 

    # Lifecycle policy: delete objects after 90 days to control storage costs
  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 90 }
  }

  labels = {
    environment = var.environment
    purpose     = "raw-work-units"
  }
}

# Stores final processed results after parsing is complete 
resource "google_storage_bucket" "parsed_objects" {
  name = "${local.prefix}-parsed-objects"
  location = var.region
  storage_class = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy = false

  labels = {
    environment = var.environment
    purpose     = "parsed-objects"
  }
}

# Stores raw documents
resource "google_storage_bucket" "raw_documents" {
  name                        = "${local.prefix}-raw-documents"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  force_destroy = false

  labels = {
    environment = var.environment
    purpose     = "raw-documents"
  }
}
