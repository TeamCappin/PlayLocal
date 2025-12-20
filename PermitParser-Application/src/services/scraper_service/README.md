# Backend README

## Overview

This backend is designed to handle web scraping, storage, and parsing of municipal data sources. It provides a modular, extensible structure to support multiple municipalities and scrapers, ensuring maintainability and scalability.

## Folder Structure

```
scraper_service/
├── config/               # Configuration files for scrapers
│   └── sources.yaml      # Defines scraping sources for each municipality
├── lib/                  # Core library code
│   ├── abstract_scraper.py   # Abstract classes for scrapers
│   ├── browser/              # Browser agent using Playwright
│   │   └── agent.py
│   ├── cli.py                # Shared CLI parser
│   ├── config.py             # Config loader and parser
│   ├── http.py               # HTTP utilities
│   ├── logging_conf.py       # Logging configuration
│   ├── robots.py             # Robots.txt handling
│   └── storage/              # Storage interfaces (Local/GCS)
├── scrapers/              # Scraper modules for each municipality
│   └── laval/
│       ├── council/       # Laval council scraper
│       │   ├── main.py
│       │   ├── web_handler.py
│       │   └── web_parser.py
│       └── donnees_quebec/  # Laval Donnees Quebec scraper
├── setup_python.sh        # Python and Playwright setup script
├── requirements.txt       # Python dependencies
├── README.md
└── dockerfile             # Dockerfile for backend containerization
```

## Components

### 1. Config

* `sources.yaml` contains all municipal sources, URLs, and settings.
* Each scraper reads its configuration to know where and how to fetch data.

### 2. Lib

* **abstract_scraper.py**: Base classes for web handlers and parsers.
* **browser/agent.py**: Playwright browser wrapper for headless or visible scraping.
* **storage/**: LocalStorage writes to disk, GCSStorage uploads to Google Cloud.
* **cli.py**: Standardizes CLI flags (`--output`, `--municipality`).
* **logging_conf.py**: Unified logging setup.

### 3. Scrapers

* Each municipality has its own module (`scrapers/laval/`).
* Each scraper has `main.py`, `web_handler.py` (fetching), and `web_parser.py` (parsing).
* Scrapers can be executed individually via `python3.11 -m scrapers.<municipality>.<scraper>.main --output FILE`.
* **Master entry point**: Run any scraper via `python3.11 -m scrapers --municipality <MUNICIPALITY> --scraper <SCRAPER> --output FILE`.
* List all available scrapers: `python3.11 -m scrapers --list`.

### 4. Data

* JSONL or JSON files are saved under `data/<municipality>/<scraper>/`.
* `RawDocument` schema is used for standardized output.

### 5. Jobs

* (TO DO) YAML files for CI/CD or cron jobs to schedule scraper runs.

## Running Locally (Development)

1. Install Python 3.11 and dependencies: (requires Ubuntu apt)
```bash
chmod +x setup_python.sh
./setup_python.sh
```

2. Activate virtual environment:
```bash
source venv/bin/activate
```

3. Run a scraper:
```bash
# Using master entry point
python3.11 -m scrapers --municipality laval --scraper council --output FILE

# List all available scrapers
python3.11 -m scrapers --list

# Direct execution (still supported)
python3.11 -m scrapers.laval.council.main --output FILE
```

4. Output will be stored under `data/laval/council/` or on GCS.

## Uploading Documents to GCS

Follow these steps if you want to push scraped files directly into Cloud Storage buckets:

1. Copy `src/scraper_service/.env.template` to `.env` and set the storage variables:
   * `GCS_RAW_BUCKET`, `GCS_BUCKET`, or `GCS_OPEN_BUCKET` — set at least one to the exact bucket name you were given (e.g. `scraped_documents_bucket`).
   * `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to the service-account JSON key provided by your GCP admin. Skip this only if you authenticate with `gcloud auth application-default login`.
2. Load the variables for your shell session (`export $(grep -v '^#' .env | xargs)` or via your preferred dotenv tool).
3. Ensure dependencies are installed (`python -m venv .venv && source .venv/bin/activate && pip install -r src/scraper_service/requirements.txt`).
4. Run the helper to upload a document into the municipality/date hierarchy:

```bash
python src/scraper_service/lib/storage/gcs.py \
    ./permit.pdf "Montreal" \
    --project-id "Project Alpha" \
    --metadata source=manual_test
```

By default this uses `StorageClient.upload_pdf`, so files land in `gs://<bucket>/<municipality-slug>/<project-id-slug>/YYYY/MM/DD/<uuid>_permit.pdf`. To override the bucket, add `--bucket some-other-bucket`; to upload non-PDF assets, pass `--content-type text/csv`, which routes through `StorageClient.upload_file` and lets you specify a custom object name if needed.

## Running with Docker

1. Build Docker image:
```bash
docker build -t scraper_service .
```

2. Run Docker container:
```bash
# Use defaults (laval/council)
docker run scraper_service

# Override with custom args
docker run scraper_service --municipality laval --scraper donnees_quebec --output FILE

# List available scrapers
docker run scraper_service --list

# With volume mount for persistent data
docker run -v $(pwd)/data:/app/data scraper_service --municipality laval --scraper council --output FILE
```

### Note 
When running the container, `data/` and `config/` can be mounted from the host to allow reading/writing files without rebuilding the image.
```bash
docker run --rm -it \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config \
  scraper_service --municipality laval --scraper council --output FILE
```

* `--rm` removes the container after it exits.
* `-it` gives interactive terminal access.
* The `-v` flags mount host folders inside the container.

## CLI Options

* `--municipality`: Municipality to scrape (e.g., `laval`)
* `--scraper`: Specific scraper to run (e.g., `council`, `donnees_quebec`)
* `--output`: Output destination - `FILE`, `STDOUT`, or `GCS`
* `--list`: List all available scrapers

## Development Guidelines

* Follow [Code Standards](https://github.com/MuneraCappin/PermitParser/wiki/Code-Standards)
* Use `RawDocument` schema for all scraper outputs.
* Unit tests located under `test/Unit Tests/`.

## Notes

* All scrapers are modular and can be extended for new municipalities.
* Browser interactions use Playwright for JS-rendered pages.
* The master entry point dynamically discovers scrapers from the folder structure.
