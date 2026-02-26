#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/tokyo/Desktop/AIADS"
CONFIG_FILE="$PROJECT_DIR/cloudflared/prismpublication-config.yml"
TUNNEL_NAME="prism-aiads"

RUN_DIR="$PROJECT_DIR/.run"
LOG_DIR="$PROJECT_DIR/logs"
VITE_PID_FILE="$RUN_DIR/vite.pid"
API_PID_FILE="$RUN_DIR/api.pid"
CLOUDFLARED_PID_FILE="$RUN_DIR/cloudflared.pid"
VITE_LOG="$LOG_DIR/vite.log"
API_LOG="$LOG_DIR/api.log"
CLOUDFLARED_LOG="$LOG_DIR/cloudflared.log"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  [[ -n "${pid:-}" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

find_existing_vite_pid() {
  ps -eo pid=,args= | awk -v p1="$PROJECT_DIR/node_modules/.bin/vite" -v p2="$PROJECT_DIR/node_modules/vite/bin/vite.js" '
    $2 == "node" && ($3 == p1 || $3 == p2) { print $1; exit }
  '
}

find_existing_api_pid() {
  ps -eo pid=,args= | awk -v target="$PROJECT_DIR/server/src/index.js" '
    $2 == "node" && (($3 == "--watch" && $4 == target) || $3 == target) { print $1; exit }
  '
}

find_existing_tunnel_pid() {
  ps -eo pid=,args= | awk -v cfg="$CONFIG_FILE" -v name="$TUNNEL_NAME" '
    $2 == "cloudflared" && $3 == "tunnel" && $4 == "--config" && $5 == cfg && $6 == "run" && $7 == name { print $1; exit }
  '
}

start_vite() {
  local existing_pid
  existing_pid="$(find_existing_vite_pid)"
  if [[ -n "$existing_pid" ]]; then
    echo "$existing_pid" >"$VITE_PID_FILE"
    echo "Vite already running (PID $existing_pid)."
    return
  fi

  if is_running "$VITE_PID_FILE"; then
    echo "Vite already running (PID $(cat "$VITE_PID_FILE"))."
    return
  fi

  echo "Starting Vite on :8080 ..."
  cd "$PROJECT_DIR"
  nohup npm run dev >"$VITE_LOG" 2>&1 &
  sleep 1
  local vite_pid
  vite_pid="$(find_existing_vite_pid)"

  if [[ -n "$vite_pid" ]]; then
    echo "$vite_pid" >"$VITE_PID_FILE"
    echo "Vite started (PID $vite_pid). Log: $VITE_LOG"
  else
    echo "Vite failed to start. Last log lines:"
    tail -n 40 "$VITE_LOG" 2>/dev/null || true
    rm -f "$VITE_PID_FILE"
  fi
}

start_api() {
  local existing_pid
  existing_pid="$(find_existing_api_pid)"
  if [[ -n "$existing_pid" ]]; then
    echo "$existing_pid" >"$API_PID_FILE"
    echo "API already running (PID $existing_pid)."
    return
  fi

  if is_running "$API_PID_FILE"; then
    echo "API already running (PID $(cat "$API_PID_FILE"))."
    return
  fi

  echo "Starting local API on :8787 ..."
  cd "$PROJECT_DIR/server"
  nohup node --watch "$PROJECT_DIR/server/src/index.js" >"$API_LOG" 2>&1 &
  sleep 1
  local api_pid
  api_pid="$(find_existing_api_pid)"

  if [[ -n "$api_pid" ]]; then
    echo "$api_pid" >"$API_PID_FILE"
    echo "API started (PID $api_pid). Log: $API_LOG"
  else
    echo "API failed to start. Last log lines:"
    tail -n 40 "$API_LOG" 2>/dev/null || true
    rm -f "$API_PID_FILE"
  fi
}

start_tunnel() {
  local existing_pid
  existing_pid="$(find_existing_tunnel_pid)"
  if [[ -n "$existing_pid" ]]; then
    echo "$existing_pid" >"$CLOUDFLARED_PID_FILE"
    echo "Tunnel already running (PID $existing_pid)."
    return
  fi

  if is_running "$CLOUDFLARED_PID_FILE"; then
    echo "Tunnel already running (PID $(cat "$CLOUDFLARED_PID_FILE"))."
    return
  fi

  echo "Starting Cloudflare tunnel ..."
  cd "$PROJECT_DIR"
  nohup cloudflared tunnel --config "$CONFIG_FILE" run "$TUNNEL_NAME" >"$CLOUDFLARED_LOG" 2>&1 &
  echo $! >"$CLOUDFLARED_PID_FILE"
  echo "Tunnel started (PID $(cat "$CLOUDFLARED_PID_FILE")). Log: $CLOUDFLARED_LOG"
}

stop_one() {
  local pid_file="$1"
  local name="$2"

  if ! is_running "$pid_file"; then
    echo "$name is not running."
    rm -f "$pid_file"
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  echo "Stopping $name (PID $pid) ..."
  kill "$pid" 2>/dev/null || true

  for _ in {1..20}; do
    if kill -0 "$pid" 2>/dev/null; then
      sleep 0.2
    else
      break
    fi
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "$name did not exit gracefully, forcing..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$pid_file"
  echo "$name stopped."
}

status() {
  if is_running "$API_PID_FILE"; then
    echo "API: RUNNING (PID $(cat "$API_PID_FILE"))"
  else
    local api_pid
    api_pid="$(find_existing_api_pid)"
    if [[ -n "$api_pid" ]]; then
      echo "$api_pid" >"$API_PID_FILE"
      echo "API: RUNNING (PID $api_pid)"
    else
      rm -f "$API_PID_FILE"
      echo "API: STOPPED"
    fi
  fi

  if is_running "$VITE_PID_FILE"; then
    echo "Vite: RUNNING (PID $(cat "$VITE_PID_FILE"))"
  else
    local vite_pid
    vite_pid="$(find_existing_vite_pid)"
    if [[ -n "$vite_pid" ]]; then
      echo "$vite_pid" >"$VITE_PID_FILE"
      echo "Vite: RUNNING (PID $vite_pid)"
    else
      rm -f "$VITE_PID_FILE"
      echo "Vite: STOPPED"
    fi
  fi

  local tunnel_pid
  tunnel_pid="$(find_existing_tunnel_pid)"
  if [[ -n "$tunnel_pid" ]]; then
    echo "$tunnel_pid" >"$CLOUDFLARED_PID_FILE"
    echo "Tunnel: RUNNING (PID $tunnel_pid)"
  else
    rm -f "$CLOUDFLARED_PID_FILE"
    echo "Tunnel: STOPPED"
  fi
}

logs() {
  echo "---- api.log ----"
  tail -n 40 "$API_LOG" 2>/dev/null || true
  echo
  echo "---- vite.log ----"
  tail -n 40 "$VITE_LOG" 2>/dev/null || true
  echo
  echo "---- cloudflared.log ----"
  tail -n 40 "$CLOUDFLARED_LOG" 2>/dev/null || true
}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/prism_stack.sh start     # Start API + Vite + Cloudflare tunnel in background
  ./scripts/prism_stack.sh stop      # Stop tunnel + Vite + API
  ./scripts/prism_stack.sh restart   # Restart all
  ./scripts/prism_stack.sh status    # Show process status
  ./scripts/prism_stack.sh logs      # Show recent logs
EOF
}

cmd="${1:-}"
case "$cmd" in
  start)
    start_api
    start_vite
    start_tunnel
    status
    ;;
  stop)
    stop_one "$CLOUDFLARED_PID_FILE" "Tunnel"
    stop_one "$VITE_PID_FILE" "Vite"
    stop_one "$API_PID_FILE" "API"
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  *)
    usage
    exit 1
    ;;
esac
