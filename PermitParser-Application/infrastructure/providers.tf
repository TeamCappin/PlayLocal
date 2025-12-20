# Configure the Google provider ONCE at the root.
# Modules will inherit this provider.
provider "google" {
  project = var.project_id
  region  = var.region
}
