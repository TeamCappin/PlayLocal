# PlayLocal - Location-based social platform for organizing local pickup sports

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TeamCappin_PlayLocal&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TeamCappin_PlayLocal)
[![codecov](https://codecov.io/gh/TeamCappin/PlayLocal/branch/dev/graph/badge.svg?token=8P22R0Z90L)](https://codecov.io/gh/TeamCappin/PlayLocal)
[![Netlify Status](https://api.netlify.com/api/v1/badges/9e082237-585c-4ac5-9085-c19eb58954ee/deploy-status)](https://app.netlify.com/projects/playlocal/deploys)
![Neon Status](https://img.shields.io/badge/Neon-Connected-green)

## Built with

![Netlify](https://img.shields.io/badge/Netlify-000000?style=for-the-badge&logo=netlify&logoColor=00C7B7)
![Render](https://img.shields.io/badge/Render-3B3B3B?style=for-the-badge&logo=render&logoColor=white)
![Brevo](https://img.shields.io/badge/Brevo-Email_SMTP-0B996E?style=for-the-badge)
![Neon](https://img.shields.io/badge/Neon-000000?style=for-the-badge&logo=postgresql&logoColor=00E599)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)

## Project Overview

PlayLocal is a location-based social platform for organizing local pickup sports. The primary
goal is to foster community and consistent participation by solving the most common problems
in casual sports: reliability, safety, and finding a welcoming group.

As lifestyles become more digital and isolated, many people seek low-pressure ways to stay
active and meet new people. The biggest barriers are often logistical uncertainty (Will enough
people show up?) and social anxiety (Will the group be welcoming and safe?). 

PlayLocal addresses these issues by creating a platform that prioritizes reliability and positive social
connections. We are committed to building an inclusive and safe environment, ensuring
everyone can find a group where they feel comfortable and respected.


### Team Members

| Name                     | Student Number | GitHub Username       |
|--------------------------|----------------|-----------------------|
| Minh Huynh               | 40210039       | @vibqetowi           |
| Omar Elmasaoudi          | 40255123       | @Omare04             |
| Asif Ali Khan            | 40211000       | @AsifAliKhan2001 @haleemaK123 |
| Melissa Rahman           | 40249231       | @mE3lissa            |
| Younes Bouhaba           | 40205816       | @Younesbhb           |
| Alexander El Ghaoui      | 40200062       | @Ghawi25             |
| David Onwionoko          | 40167358       | @d-realblank         |
| Steven Zrihen            | 40174529       | @elshito             |
| Youssef Yacoub           | 40189020       | @Pharo-14            |
| Hudson Lu                | 40254326       | @HudsonLu            |
| Allaye Dicko             | 40224071       | @allaye4             |
| Adib Akkari              | 40216815       | @adssib              |

## Release Demos 

### Release 1 : https://github.com/TeamCappin/PlayLocal/tree/dev/Admin/Release-1-Presentation

### Release 2

Release 2 Presentation video: https://drive.google.com/file/d/1mFgsqjgU6McoWA14zVe59H-5EelsNpwP/view?usp=drive_link

Release 2 Product-Demo: https://drive.google.com/file/d/1PNaAeSPwOFa7_IYM0w3t6a3zuS-GDuko/view?usp=drive_link

Release 2 Presentation: [PlayLocal - 490 Release 2 Presentation.pdf](https://github.com/user-attachments/files/25198789/PlayLocal.-.490.Release.2.Presentation.pdf)


### Release 3

Release 3 Presentation video: 
https://drive.google.com/file/d/1aWjmvHtUVAjDPk6fCBIBTwpT40Bs3ugP/view?usp=drive_link

Release 3 Product-Demo:
https://drive.google.com/file/d/1cyZWm81DQQtvDxtmd5R5FcQTYgaLSeg-/view?usp=drive_link

Release 3 Presentation Slides: [PlayLocal - 490 Release 3 Presentation.pdf](https://github.com/user-attachments/files/26695027/PlayLocal.-.490.Release.3.Presentation.pdf)
https://docs.google.com/presentation/d/1nrnqzFSEBBAfjynYyA1WOSujuJm-vrWE6KtBWEiaP50/edit?usp=sharing

## Developer Manual

Make sure you have both `npm` & `mvn` installed
```sh
mvn --version
npm --version
```

### Docker Development (Recommended)

Run the full stack (Frontend + Backend + Database) with a single command:

```sh
#normal run
docker compose up --build

# hard reset
docker compose down -v && docker compose build --no-cache && docker compose up
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8081/swagger-ui/index.html
- **Database**: http://localhost:5439

To stop the services:
```sh
docker compose down
```

### Docker Production-Oriented Configuration

Use the production override when you want behavior closer to deployment (production Spring profile, env-driven secrets, and restart policies).

Use the base file (`docker-compose.yml`) for local development defaults.
Use the production setup (`docker-compose.yml` + `docker-compose.prod.yml`) for production-like runtime behavior.

1. Create a production env file from the template:
```sh
cp .env.prod.example .env.prod
```

2. Update `.env.prod` with real secrets and environment values.
   `.env.prod` is ignored by Git, so secrets stay local by default.

3. If you are reusing old Docker volumes with different DB credentials, reset them first:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml down -v
```

4. Start the production-oriented stack:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

5. Stop the production-oriented stack:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml down
```

### Dev vs Production Compose Differences

| Area | Development (`docker-compose.yml`) | Production-oriented (`docker-compose.prod.yml`) |
| --- | --- | --- |
| Backend profile | `SPRING_PROFILES_ACTIVE=dev` | `SPRING_PROFILES_ACTIVE=prod` |
| Secrets and env | Local defaults are embedded for convenience | Sensitive values are expected from `.env.prod` |
| Restart behavior | No restart policy | `restart: unless-stopped` for long-running services |
| MinIO configuration | Dev console enabled and fixed local credentials | Runtime command is simplified and credentials/bucket come from env values |
| Migration strictness | Flyway validation disabled for local velocity | Flyway validation enabled for production-like startup checks |

### Reviewer Quick Check

1. Verify the production override resolves correctly:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml config
```
2. Start production-oriented services:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```
3. Confirm backend health:
```sh
curl http://localhost:8081/api/v1/health
```
4. Stop the stack:
```sh
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml down
```

# Testing

This folder documents shared testing artifacts for PlayLocal.
Code-based test suites live in the backend and frontend apps.

## Current structure

- `testing/README.md` (this file)

## Where tests live today

- Backend: `playlocal/backend/src/test/java`
- Frontend: `playlocal/frontend/test`

## Quick commands

- Backend unit/integration: `cd playlocal/backend && ./mvnw test`
- Frontend: `cd playlocal/frontend && npm test`

Performance validation lives in `performance/` at the repo root — see `performance/README.md`.
- Backend unit/integration: (cd playlocal/backend && ./mvnw test)
- Backend concurrency: requires Docker (Testcontainers)
- Frontend: (cd playlocal/frontend && npm test)

CI checks

- Docker image build on PRs: `.github/workflows/docker-build-pr.yml` builds the backend and frontend images to catch container regressions early.

### Manual Development

```sh
cd backend/playlocal/
mvn clean install
mvn spring-boot:run
```

the go to `http://localhost:8081/`

```sh
cd frontend/playlocal/
npm install
npm run dev
```

then go to `http://localhost:3000`

### Testing 
```sh
# backend
./mvnw clean test

# frontend
npm test
```

### Formatting & Lint:

```sh
cd playlocal/backend/
mvn -B checkstyle:check

cd playlocal/frontend/
npm run lint:errors


npm run format:check
npm run format:write
```


