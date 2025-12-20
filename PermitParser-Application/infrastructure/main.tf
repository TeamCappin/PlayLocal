module "gcs_buckets" {
  source      = "./modules/gcs_buckets"
  project_id  = var.project_id
  environment = var.environment
  region      = var.region
}

module "iam" {
  source      = "./modules/iam"
  project_id  = var.project_id
  environment = var.environment
  region      = var.region

  raw_work_units_bucket_name = module.gcs_buckets.raw_work_units_bucket
  parsed_objects_bucket_name = module.gcs_buckets.parsed_objects_bucket
  raw_documents_bucket_name = module.gcs_buckets.raw_documents_bucket
}
