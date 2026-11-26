#!/usr/bin/env bash
# =============================================================================
# Comparativo 1×N do FRONT-PWA (Next.js) com Locust
#
# Sobe N processos `next start` (portas 3201..320N), executa a MESMA carga e
# grava os resultados para o probe-exporter/Grafana.
#
# Uso:
#   N_LIST="1 2" USERS=40 HOLD=20 ./run-scale.sh
# =============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
HERE=$(pwd)
ROOT=$(cd "$HERE/.." && pwd)

N_LIST="${N_LIST:-1 2}"
USERS="${USERS:-40}"
USERS_PER_INSTANCE="${USERS_PER_INSTANCE:-}"
SPAWN="${SPAWN:-5}"
HOLD="${HOLD:-20}"
PROCS="${PROCS:-1}"
BASE_PORT="${BASE_PORT:-3200}"
RESULTS_FILE="${RAIJI_SCALE_RESULTS:-$HERE/scale-results.json}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3300}"
GRAFANA_AUTH="${GRAFANA_AUTH:-admin:admin}"
ANNOTATE="${ANNOTATE:-1}"
STAMP=$(date +%Y%m%d-%H%M%S)
REPORTS=reports
mkdir -p "$REPORTS"

PY=python3
[ -x .venv/bin/python ] && PY=.venv/bin/python
LOCUST=.venv/bin/locust
[ -x "$LOCUST" ] || LOCUST="locust"
command -v "$LOCUST" >/dev/null 2>&1 || { echo "[!] Locust não instalado (run.sh deps)"; exit 1; }

if [ ! -f "$ROOT/.next/BUILD_ID" ]; then
  echo "[i] build de produção ausente; rodando npm run build..."
  (cd "$ROOT" && npm run build) || exit 1
fi

PIDS=()
cleanup() {
  for pid in "${PIDS[@]:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

start_instances() { # $1 = N
  local n=$1 i port
  PIDS=()
  for i in $(seq 1 "$n"); do
    port=$((BASE_PORT + i))
    ( cd "$ROOT" && exec node_modules/.bin/next start -p "$port" -H 127.0.0.1 ) \
      > "$REPORTS/front-scale-$port-$STAMP.log" 2>&1 &
    PIDS+=("$!")
  done
  for i in $(seq 1 "$n"); do
    port=$((BASE_PORT + i))
    for _ in $(seq 1 60); do
      curl -sf "http://127.0.0.1:$port/login" >/dev/null 2>&1 && break
      sleep 1
    done
    if ! curl -sf "http://127.0.0.1:$port/login" >/dev/null 2>&1; then
      echo "[!] instância na porta $port não respondeu"; return 1
    fi
  done
}

urls_for() { # $1 = N
  local n=$1 i out=""
  for i in $(seq 1 "$n"); do out+="http://127.0.0.1:$((BASE_PORT + i)),"; done
  printf '%s' "${out%,}"
}

annotate() {
  [ "$ANNOTATE" = 1 ] || return 0
  curl -sf -u "$GRAFANA_AUTH" -H 'Content-Type: application/json' \
    -X POST "$GRAFANA_URL/api/annotations" \
    -d "{\"text\":\"$1\",\"tags\":[\"raiji-scale\",\"front\"]}" >/dev/null 2>&1 || true
}

for n in $N_LIST; do
  echo
  echo "[i] ===== FRONT N=$n instância(s) · $USERS usuários · ${HOLD}s ====="
  start_instances "$n" || exit 1
  urls=$(urls_for "$n")
  if [ -n "$USERS_PER_INSTANCE" ]; then
    run_users=$((n * USERS_PER_INSTANCE)); mode="por instância ($USERS_PER_INSTANCE cada)"
  else
    run_users=$USERS; mode="carga fixa"
  fi
  echo "[i] carga total: $run_users usuários ($mode)"
  annotate "Início escala FRONT N=$n (users=$run_users)"
  procs_args=()
  [ "$PROCS" -gt 1 ] && procs_args=(--processes "$PROCS" --master-bind-port "${MASTER_PORT:-5557}")
  RAIJI_SCALE_URLS="$urls" \
  RAIJI_SCALE_TOKEN="${RAIJI_SCALE_TOKEN:-}" \
  RAIJI_SCALE_PATH="${RAIJI_SCALE_PATH:-}" \
    "$LOCUST" -f scale_locustfile.py --headless --only-summary \
      --html "$REPORTS/front-scale-n$n-$STAMP.html" \
      --csv "$REPORTS/front-scale-n$n-$STAMP" \
      "${procs_args[@]}" -u "$run_users" -r "$SPAWN" -t "${HOLD}s"
  rc=$?
  annotate "Fim escala FRONT N=$n"
  csv="$REPORTS/front-scale-n$n-${STAMP}_stats.csv"
  [ -f "$csv" ] && "$PY" scale_report.py "$csv" "$n" "$RESULTS_FILE"
  cleanup; PIDS=()
  [ "$rc" -eq 0 ] || echo "[i] Locust terminou com código $rc"
done

echo "[ok] FRONT: resultados em $RESULTS_FILE"
