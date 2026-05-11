#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PLAYLOCAL_BASE_URL:-http://localhost:8081/api/v1}"
EMAIL="${PLAYLOCAL_EMAIL:-alex.chen@demo.com}"
PASSWORD="${PLAYLOCAL_PASSWORD:-password123}"
LAT="${PLAYLOCAL_LAT:-45.5312}"
LON="${PLAYLOCAL_LON:--73.6205}"
RADIUS_KM="${PLAYLOCAL_RADIUS_KM:-25}"
ITERATIONS="${PLAYLOCAL_ITERATIONS:-5}"
TIMEOUT_SECONDS="${PLAYLOCAL_TIMEOUT_SECONDS:-20}"
STRICT_THRESHOLDS="${PLAYLOCAL_STRICT_THRESHOLDS:-0}"

LOGIN_THRESHOLD_MS="${PLAYLOCAL_LOGIN_THRESHOLD_MS:-200}"
DISCOVERY_THRESHOLD_MS="${PLAYLOCAL_DISCOVERY_THRESHOLD_MS:-500}"
JOIN_THRESHOLD_MS="${PLAYLOCAL_JOIN_THRESHOLD_MS:-200}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command python3

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

login_times_file="$work_dir/login_times.txt"
discovery_times_file="$work_dir/discovery_times.txt"
join_times_file="$work_dir/join_times.txt"
join_results_file="$work_dir/join_results.txt"

perform_request() {
  local method="$1"
  local url="$2"
  local body_file="$3"
  local response_file="$4"
  shift 4

  local curl_output
  # Always create the response file so error paths can safely print it.
  : > "$response_file"
  if [[ -n "$body_file" ]]; then
    if ! curl_output="$(curl -sS --max-time "$TIMEOUT_SECONDS" -X "$method" "$url" \
      -H "Accept: application/json" \
      "$@" \
      --data-binary "@$body_file" \
      -o "$response_file" \
      -w "%{http_code} %{time_total}")"; then
      printf '000 0\n'
      return 0
    fi
  else
    if ! curl_output="$(curl -sS --max-time "$TIMEOUT_SECONDS" -X "$method" "$url" \
      -H "Accept: application/json" \
      "$@" \
      -o "$response_file" \
      -w "%{http_code} %{time_total}")"; then
      printf '000 0\n'
      return 0
    fi
  fi

  printf '%s\n' "$curl_output"
}

json_get() {
  local response_file="$1"
  local expression="$2"
  # Dot-path extractor used for simple response fields (for example: token, message).
  python3 - "$response_file" "$expression" <<'PY'
import json
import sys

path = sys.argv[2]
with open(sys.argv[1], 'r', encoding='utf-8') as handle:
    data = json.load(handle)

value = data
for segment in path.split('.'):
    if not segment:
        continue
    if isinstance(value, list):
        value = value[int(segment)]
    else:
        value = value.get(segment)
    if value is None:
        break

if value is None:
    sys.exit(1)
if isinstance(value, (dict, list)):
    print(json.dumps(value))
else:
    print(value)
PY
}

extract_game_ids() {
  local response_file="$1"
  python3 - "$response_file" <<'PY'
import json
import sys

with open(sys.argv[1], 'r', encoding='utf-8') as handle:
    data = json.load(handle)

for item in data:
    game_id = item.get('gameId')
    if game_id:
        print(game_id)
PY
}

record_seconds_as_ms() {
  local seconds_value="$1"
  local target_file="$2"
  python3 - "$seconds_value" >> "$target_file" <<'PY'
import sys
print(round(float(sys.argv[1]) * 1000, 2))
PY
}

join_one_game() {
  local token="$1"
  local game_ids_file="$2"
  local join_request_file="$work_dir/join-request.json"
  printf '{}\n' > "$join_request_file"

  # Try discovered games in order and stop at the first successful join.
  while IFS= read -r game_id; do
    [[ -n "$game_id" ]] || continue

    local join_response="$work_dir/join-${game_id}.json"
    local join_meta
    local join_code
    local join_time
    local join_status
    local message

    join_meta="$(perform_request "POST" "$BASE_URL/games/$game_id/join" "$join_request_file" "$join_response" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json")"
    join_code="${join_meta%% *}"
    join_time="${join_meta##* }"

    if [[ "$join_code" == "200" ]]; then
      record_seconds_as_ms "$join_time" "$join_times_file"
      join_status="$(json_get "$join_response" "joinStatus" 2>/dev/null || echo UNKNOWN)"
      message="$(json_get "$join_response" "message" 2>/dev/null || echo "")"
      printf '%s | %s | %s\n' "$game_id" "$join_status" "$message" >> "$join_results_file"
      return 0
    fi
  done < "$game_ids_file"

  return 1
}

cat <<EOF
PlayLocal lightweight API timing check
Base URL: $BASE_URL
Demo user: $EMAIL
Iterations: $ITERATIONS
Discovery query: lat=$LAT lon=$LON radiusKm=$RADIUS_KM
EOF

for iteration in $(seq 1 "$ITERATIONS"); do
  echo "Running iteration $iteration/$ITERATIONS..."

  login_payload="$work_dir/login-$iteration.json"
  login_response="$work_dir/login-$iteration-response.json"
  cat > "$login_payload" <<EOF
{"email":"$EMAIL","password":"$PASSWORD"}
EOF

  login_meta="$(perform_request "POST" "$BASE_URL/auth/login" "$login_payload" "$login_response" -H "Content-Type: application/json")"
  login_code="${login_meta%% *}"
  login_time="${login_meta##* }"
  if [[ "$login_code" != "200" ]]; then
    echo "Login failed with HTTP $login_code" >&2
    cat "$login_response" >&2
    exit 1
  fi
  record_seconds_as_ms "$login_time" "$login_times_file"
  token="$(json_get "$login_response" "token")"

  discovery_response="$work_dir/discovery-$iteration-response.json"
  discovery_url="$BASE_URL/games?lat=$LAT&lon=$LON&radiusKm=$RADIUS_KM"
  # Discovery is the geospatial path under test.
  discovery_meta="$(perform_request "GET" "$discovery_url" "" "$discovery_response" -H "Authorization: Bearer $token")"
  discovery_code="${discovery_meta%% *}"
  discovery_time="${discovery_meta##* }"
  if [[ "$discovery_code" != "200" ]]; then
    echo "Discovery request failed with HTTP $discovery_code" >&2
    cat "$discovery_response" >&2
    exit 1
  fi
  record_seconds_as_ms "$discovery_time" "$discovery_times_file"

  game_ids_file="$work_dir/discovery-$iteration-game-ids.txt"
  extract_game_ids "$discovery_response" > "$game_ids_file"
  if [[ ! -s "$game_ids_file" ]]; then
    echo "Discovery returned no games. Check seed data or override PLAYLOCAL_LAT/PLAYLOCAL_LON." >&2
    exit 1
  fi

  if ! join_one_game "$token" "$game_ids_file"; then
    echo "No joinable game returned HTTP 200. Check seed data, account state, or filters." >&2
    exit 1
  fi
done

python3 - "$login_times_file" "$discovery_times_file" "$join_times_file" "$join_results_file" \
  "$LOGIN_THRESHOLD_MS" "$DISCOVERY_THRESHOLD_MS" "$JOIN_THRESHOLD_MS" "$STRICT_THRESHOLDS" <<'PY'
import math
import statistics
import sys
from pathlib import Path


def read_values(path_str):
    path = Path(path_str)
    return [float(line.strip()) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]


def percentile_95(values):
  # Use nearest-rank style p95 for small sample sizes.
    ordered = sorted(values)
    index = max(0, math.ceil(0.95 * len(ordered)) - 1)
    return ordered[index]


def summarize(name, values, threshold):
    p95 = percentile_95(values)
    avg = statistics.fmean(values)
    minimum = min(values)
    maximum = max(values)
    passed = p95 <= threshold
    return {
        'name': name,
        'samples': len(values),
        'avg': avg,
        'p95': p95,
        'min': minimum,
        'max': maximum,
        'threshold': threshold,
        'passed': passed,
    }


login = summarize('POST /auth/login', read_values(sys.argv[1]), float(sys.argv[5]))
discovery = summarize('GET /games', read_values(sys.argv[2]), float(sys.argv[6]))
join = summarize('POST /games/{id}/join', read_values(sys.argv[3]), float(sys.argv[7]))
strict = sys.argv[8] == '1'

print('\nTiming summary (milliseconds)')
print('| Endpoint | Samples | Avg | P95 | Min | Max | Target | Result |')
print('| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
for item in (login, discovery, join):
    result = 'PASS' if item['passed'] else 'WARN'
    print(
        f"| {item['name']} | {item['samples']} | {item['avg']:.2f} | {item['p95']:.2f} | {item['min']:.2f} | {item['max']:.2f} | <= {item['threshold']:.0f} | {result} |"
    )

join_results = Path(sys.argv[4]).read_text(encoding='utf-8').splitlines()
print('\nJoin outcomes')
for line in join_results:
    print(f'- {line}')

if strict and not all(item['passed'] for item in (login, discovery, join)):
    sys.exit(2)
PY
