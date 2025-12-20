# Django REST Backend README

## Overview

This backend provides a **RESTful API** for the Data Visualization Platform.  
It is built using **Django REST Framework (DRF)** and serves as the data layer for the **Next.js frontend**.  
It handles project data storage, filtering, user authentication (JWT), and multi-language support (EN/FR).  
The structure is modular and scalable to support future analytics, dashboards, and map-based queries.

## Folder Structure

```
backend/
├── config/                         # Main Django configuration
│   ├── settings/
│   │   ├── base.py                 # Common settings shared across environments
│   │   ├── dev.py                  # Dev overrides (debug, sqlite, etc.)
│   │   ├── prod.py                 # Production overrides (PostgreSQL, CORS)
│   │   └── test.py                 # Test-specific configs
│   ├── urls.py                     # Root API routing
│   ├── asgi.py
│   └── wsgi.py
│
├── apps/                           # Core apps (modular architecture)
│   ├── users/                      # Authentication & profiles
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   │       └── test_auth_api.py
│   │
│   ├── projects/                   # Core domain: project visualization data
│   │   ├── models.py               # Project, Document, Source tables
│   │   ├── serializers.py          # Data serialization for API
│   │   ├── filters.py              # Search and filter logic
│   │   ├── views.py                # `/projects` and `/search` endpoints
│   │   ├── urls.py
│   │   ├── services.py             # Business logic layer
│   │   └── tests/
│   │       ├── test_project_api.py
│   │       └── test_models.py
│   │
│   ├── analytics/                  # (Planned) data aggregation and statistics
│   └── __init__.py
│
├── common/                         # Shared utilities across apps
│   ├── permissions.py
│   ├── pagination.py
│   ├── mixins.py
│   ├── utils.py
│   └── constants.py
│
├── docs/                           # Documentation and schema
│   ├── ERD.png                     # Entity relationship diagram
│   ├── API_Documentation.md        # Endpoint references
│   └── OpenAPI_Schema.json
│
├── scripts/                        # Management and setup scripts
│   ├── init_db.sh
│   └── load_seed_data.py
│
├── tests/                          # Integration and end-to-end tests
│   ├── __init__.py
│   └── integration/
│       ├── test_auth_flow.py
│       └── test_end_to_end.py
│
├── manage.py
├── requirements.txt
├── dockerfile
└── README.md
```

## Components

### 1. Config
* Modularized `settings/` folder for different environments (`dev`, `prod`, `test`).
* Environment variables handled via `.env` or `django-environ`.
* CORS configured for Next.js frontend (localhost + production domains).

### 2. Apps
Each major domain is an isolated Django app:

* **users/**  
  Handles user registration, login, and JWT-based authentication via SimpleJWT.  
  Provides endpoints:
  - `POST /auth/login`
  - `GET /auth/me`

* **projects/**  
  Core data module for project visualization.  
  Endpoints include:
  - `GET /projects` — list/filter projects (with optional bbox or query params)  
  - `GET /projects/search` — keyword search  
  - `GET /projects/{id}` — detailed project info  
  - `GET /healthz` — health check  

* **analytics/** *(planned)*  
  Future support for data summaries and trends for dashboards.

### 3. Common
* **permissions.py** — reusable DRF permissions.
* **mixins.py** — shared DRF view mixins.
* **pagination.py** — default pagination for large datasets.
* **utils.py** — helper functions (date formatting, filtering, etc.).
* **constants.py** — global constants (e.g., status choices, project types).

### 4. Docs
* **ERD.png** — Database relationship diagram between core models.
* **OpenAPI_Schema.json** — Auto-generated via `drf-spectacular` or `drf-yasg`.
* **API_Documentation.md** — Manual notes on versioned endpoints.

# Running Locally (Development)

1. **Install Python and dependencies**
```bash
python -m venv venv
source venv/bin/activate -MAC OR .\.venv\Scripts\activate -WINDOWS
pip install -r requirements.txt
```
- Create requirements.txt - pip freeze > requirements.txt

2. **Create and configure `.env` file**
```bash
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgres://postgres:password@localhost:5432/dataviz
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

3. **Run migrations**
```bash
python manage.py migrate
```

4. **Start local server**
```bash
python manage.py runserver
```

5. Access API at  
 `http://127.0.0.1:8000/api/v1`

A more useful view would be the Swagger view at `http://127.0.0.1:8000/api/v1/docs/`

## Running with Docker

1. **Build Docker image**
```bash
docker build -t dataviz_backend .
```

2. **Run container**
```bash
docker run --rm -it   -p 8000:8000   --env-file .env   dataviz_backend
```

3. The backend is now running at  
 `http://localhost:8000`

## Frontend Integration (Next.js)

* The **Next.js frontend** connects to this backend via REST endpoints under `/api/`.
* Common calls include:
  - `/projects` → for map and table visualization  
  - `/auth/login` → for user authentication  
  - `/projects/{id}` → for project details modal  
* For bilingual UI, **Next.js handles i18n**, not the backend (using `next-i18next`).

## Development Guidelines

* Follow [Code Standards](https://github.com/MuneraCappin/PermitParser/wiki/Code-Standards)
* Maintain unit tests under `apps/<module>/tests/`
* Keep API contracts documented in `/docs/API_Documentation.md`
* Format code with `black`, `isort`, and `flake8`
* Use `pytest` or Django’s test runner for QA

## Notes

* Designed for modular scalability — new endpoints = new app under `apps/`.
* Supports PostGIS for geospatial features (map bounding box filters).
* API automatically documented with Swagger/Redoc.
* JWT auth ensures secure access between frontend and backend.
* Localization handled client-side (Next.js i18n).
