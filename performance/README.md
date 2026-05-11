# Performance Validation Artifact

This folder contains a lightweight, API timing check for PlayLocal.
It validates three concrete implementation points from the performance plan:

- `POST /api/v1/auth/login`: authentication latency and login path stability
- `GET /api/v1/games?lat=...&lon=...&radiusKm=...`: geospatial game discovery latency
- `POST /api/v1/games/{id}/join`: concurrency-safe join path latency (`SELECT FOR UPDATE` / pessimistic lock)

## Files

- `api_timing_check.sh`: bash script that logs in, runs geospatial discovery, joins a discovered game, and reports average plus p95 timings

## Default assumptions

The script is designed to run against the local Docker stack and seeded demo data:

- Base URL: `http://localhost:8081/api/v1`
- Demo account: `alex.chen@demo.com`
- Demo password: `password123`
- Discovery location: Montreal (`45.5312`, `-73.6205`) with `25 km` radius

Those defaults match seeded users and games created by the backend Flyway demo migrations.

## Prerequisites

1. Start the local stack:
   `docker compose up -d`
2. Confirm the backend is healthy:
   `curl http://localhost:8081/api/v1/health`
3. Ensure `curl` and `python3` are available

## Run it

From the repository root:

```bash
chmod +x performance/api_timing_check.sh
./performance/api_timing_check.sh
```

## Optional overrides

You can point the check at another environment or use a different demo user:

```bash
PLAYLOCAL_BASE_URL=http://localhost:8081/api/v1 \
PLAYLOCAL_EMAIL=minh.h@demo.com \
PLAYLOCAL_PASSWORD=password123 \
PLAYLOCAL_LAT=45.5312 \
PLAYLOCAL_LON=-73.6205 \
PLAYLOCAL_RADIUS_KM=25 \
PLAYLOCAL_ITERATIONS=5 \
./performance/api_timing_check.sh
```

Available environment variables:

- `PLAYLOCAL_BASE_URL`
- `PLAYLOCAL_EMAIL`
- `PLAYLOCAL_PASSWORD`
- `PLAYLOCAL_LAT`
- `PLAYLOCAL_LON`
- `PLAYLOCAL_RADIUS_KM`
- `PLAYLOCAL_ITERATIONS`
- `PLAYLOCAL_TIMEOUT_SECONDS`
- `PLAYLOCAL_LOGIN_THRESHOLD_MS`
- `PLAYLOCAL_DISCOVERY_THRESHOLD_MS`
- `PLAYLOCAL_JOIN_THRESHOLD_MS`
- `PLAYLOCAL_STRICT_THRESHOLDS=1` to make threshold warnings fail the script

## What success looks like

A successful run:

- returns HTTP `200` for login
- returns HTTP `200` and at least one game from discovery
- returns HTTP `200` for at least one join attempt
- prints a summary table with average and p95 timings for each endpoint

By default, threshold misses are reported as `WARN` so evaluators can still inspect the measurements. Set `PLAYLOCAL_STRICT_THRESHOLDS=1` if you want warnings to fail the run.
