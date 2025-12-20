# Workflow Templates

This directory contains reusable GitHub Actions workflow templates. Copy any
template into `.github/workflows/` (or reference it from a `workflow_call`)
within your repository to enable the workflow.

## Available Templates

* **`gcp-container-build.yml`**: Builds the local Docker context and pushes the
  image to Google Cloud Artifact Registry or Container Registry.

  * **Secrets:** `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_KEY`
  * **Required inputs:** `image_name`, `artifact_host`, `artifact_path`, `dockerfile_path`
  * **Optional inputs:** `image_tag`

* **`gcp-cloud-run-deploy.yml`**: Deploys an existing container image to Cloud Run.

  * **Secrets:**

    * `GCP_PROJECT_ID` – Google Cloud project ID.
    * `GCP_SERVICE_ACCOUNT_KEY` – Base64-encoded JSON key for the service account with Cloud Run deploy permissions.
    * `CLOUD_RUN_SERVICE` – Name of the Cloud Run service to deploy to.
    * `CLOUD_RUN_REGION` – The region where the service is deployed (e.g., `us-central1`).
    * `CLOUD_RUN_IMAGE` – Full image URL (e.g., `us-docker.pkg.dev/<project>/<repo>/<image>:tag`).
  * **Inputs:**

    * Optional `revision_suffix` (for custom revision naming in `workflow_dispatch`).
  * **Environment overrides:**

    * `CLOUD_RUN_PLATFORM` (defaults to `managed`).
    * `CLOUD_RUN_FLAGS` (defaults to `--allow-unauthenticated`).
