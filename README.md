[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=munera-intelligence_permitparser&metric=alert_status&token=b7dde5943a03cee510ad8557f044edec680e41e1)](https://sonarcloud.io/summary/new_code?id=munera-intelligence_permitparser)
[![codecov](https://codecov.io/gh/munera-intelligence/PermitParser/graph/badge.svg?token=ASZJG8B9QF)](https://codecov.io/gh/munera-intelligence/PermitParser)
[![Last Commit](https://img.shields.io/github/last-commit/Munera-Intelligence/PermitParser/dev?style=flat-square)](https://github.com/Munera-Intelligence/PermitParser/commits/dev)

# PermitParser - Building Permit Data Extraction System

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)](https://python.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![pytest](https://img.shields.io/badge/Testing-pytest-0A9EDC?style=for-the-badge&logo=pytest)](https://pytest.org/)

</div>

## 🎯 Project Overview

PermitParser is a series of custom ETL pipelines designed to scrape and parse real estate OSINT from various municipalities in the greater Montreal area. 

Each municipality uses a different system and document format, requiring city-specific parsers to extract key information from unstructured sources (HTML, PDFs, etc.) and load it into a structured database.


This structured database is provided to our stakeholder, Munera Intelligence, for use in their downstream data analysis and construction prospecting systems.

### Team Members

| Name                     | Student Number | GitHub Username       |
|--------------------------|----------------|-----------------------|
| Minh Huynh               | 40210039       | @vibqetowi           |
| Omar Elmasaoudi          | 40255123       | @Omare04             |
| Asif Ali Khan            | 40211000       | @AsifAliKhan2001     |
| Melissa Rahman           | 40249231       | @mE3lissa            |
| Younes Bouhaba           | 40205816       | @Younesbhb           |
| Alexander El Ghaoui      | 40200062       | @Ghawi25             |
| David Onwionoko          | 40167358       | @d-realblank         |
| Steven Zrihen            | 40174529       | @elshito             |
| Youssef Yacoub           | 40189020       | @Pharo-14            |
| Hudson Lu                | 40254326       | @HudsonLu            |
| Allaye Dicko             | 40224071       | @allaye4             |
| Adib Akkari              | 40216815       | @adssib              |

## 📚 Important Links

- [Project Wiki](https://github.com/munera-intelligence/PermitParser/wiki)
- [DEI Statement](https://github.com/munera-intelligence/PermitParser/wiki/Diversity-Statement)
- [Meeting Notes](https://github.com/munera-intelligence/PermitParser/tree/dev/Documentation/Meeting-Notes)
- [Release 1 Presentation](https://github.com/munera-intelligence/PermitParser/tree/dev/Documentation/Admin/Release-1-Presentation)


## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose
- Google Cloud SDK (gcloud CLI)
- Git

### Local Development Setup

1.  **Clone the repository**
   ```bash
   git clone https://github.com/munera-intelligence/PermitParser.git
   cd PermitParser
   ```

2.  **Set up the PermitParser-Application**
    Navigate to the application directory:
    ```bash
    cd "PermitParser-Application"
    ```
    Set up a Python virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
    Install the required dependencies from all `requirements.txt` files:
    ```bash
    pip install -r ci-requirements.txt
    pip install -r src/services/scraper_service/requirements.txt
    pip install -r src/services/completion_tracker_service/requirements.txt
    pip install -r src/services/parser_service/requirements.txt
    pip install -r src/services/decomposition_service/requirements.txt
    ```

3.  **Set up environment variables**
   In the `PermitParser-Application` directory, copy the example environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4.  **Run with Docker**
   From the `PermitParser-Application` directory, you can run the services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

### Web-Portal Setup

The Web-Portal is a separate application with its own setup. Please refer to the `README.md` files within its directories for instructions:
- **Frontend**: `Web-Portal/frontend/README.md`
- **Backend**: `Web-Portal/backend/README.md`

### Project Structure

```
.
├── Documentation/
│   ├── Admin/
│   ├── Investigations/
│   └── Meeting-Notes/
├── PermitParser-Application/
│   ├── infrastructure/
│   ├── src/
│   └── tests/
├── PermitParser.wiki/
│   └── plantuml/
├── Web-Portal/
│   ├── backend/
│   └── frontend/
└── ... (configuration files)
```

#### Directory Descriptions

*   **Documentation/**: Contains all project-related documentation, including administrative documents, research, and meeting notes.
*   **PermitParser-Application/**: The main Python application for parsing permits. It includes the `src` for the application logic, `tests` for quality assurance, and `infrastructure` for deployment configurations.
*   **PermitParser.wiki/**: The project's wiki, containing detailed documentation on various aspects of the project like architecture, standards, and plans.
*   **Web-Portal/**: The web interface for the PermitParser-Application, separated into a `frontend` and `backend`.
*   **Root Directory**: Contains top-level configuration files like `LICENSE`, `CODEOWNERS`, and `sonar-project.properties`.

### GCS Upload Helper
The `StorageClient` is a wrapper around `google-cloud-storage` used by scrapers to persist artifacts. It is located at `PermitParser-Application/src/services/scraper_service/lib/storage/gcs.py`. Key features include:

- Configurable retry behaviour via `StorageClient(..., max_attempts=3, base_delay=1.0)` for tuning exponential backoff.
- Automatic resumable uploads when files exceed the `resumable_threshold` (default 8 MB) or when `resumable=True` is provided. Chunk size can be customized through `resumable_chunk_size` or per-call `chunk_size`.
- Optional gzip compression for text and CSV assets with the constructor flag `enable_gzip_for_text` or the per-upload `enable_gzip` argument. When enabled, uploads set `content_encoding="gzip"`.
- Advanced upload controls per call, including `timeout`, `if_generation_match`, and custom `retry` policies.

Example:

```python
from services.scraper_service.lib.storage.gcs import StorageClient

client = StorageClient(
    bucket_name="my-bucket",
    max_attempts=5,
    enable_gzip_for_text=True,
)

client.upload_file(
    "/tmp/report.csv",
    object_name="reports/daily.csv",
    resumable=True,
    timeout=120,
)
```

Prefer importing the convenience helper via the stable re-export:

```python
from services.scraper_service.lib.storage import upload_scraped_pdf
```

**Bucket selection & authentication**
- Buckets are resolved via environment variables in order: `GCS_RAW_BUCKET`, `GCS_BUCKET`, then `GCS_OPEN_BUCKET`.
- Storage access relies on Google Cloud Application Default Credentials (ADC). For local development, run `gcloud auth application-default login` so ADC can discover your credentials before running scrapers.


### Quality Assurance

| Category  | Tools                                                             |
| --------- | ----------------------------------------------------------------- |
| **Testing** | • pytest for unit testing |
| **CI/CD** | • GitHub Actions |


## Testing

Run the test suite from the `PermitParser-Application` directory:
```bash
pytest tests/ --cov=src --cov-report=html
```

## Deployment

The application is deployed on Google Cloud Platform using:
- **Cloud Run** for containerized API services
- **Cloud Storage** for document storage
- **Cloud SQL** for structured data
- **Cloud Build** for CI/CD

Deploy to production:
```bash
gcloud builds submit --config cloudbuild.yaml
```
