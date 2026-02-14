#!/usr/bin/env bash
set -euo pipefail

# Full redeploy script for:
# - backend (Nest + PM2)
# - bot (Node + PM2)
# - frontend (Next.js + PM2)
# - admin (Flask + Docker Compose)
#
# Usage:
#   ./deploy/redeploy-all.sh
#   ./deploy/redeploy-all.sh --pull

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DO_PULL="${1:-}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found"
    exit 1
  fi
}

pm2_restart_or_start() {
  local name="$1"
  shift
  if pm2 describe "$name" >/dev/null 2>&1; then
    log "Restart PM2 process: $name"
    pm2 restart "$name" --update-env
  else
    log "Start PM2 process: $name"
    pm2 start "$@"
  fi
}

ensure_cmd npm
ensure_cmd pm2
ensure_cmd docker

if [[ "$DO_PULL" == "--pull" ]]; then
  ensure_cmd git
  log "Pull latest changes"
  git -C "$PROJECT_ROOT" pull
fi

log "Install dependencies and build backend"
npm --prefix "$PROJECT_ROOT/backend" ci
npm --prefix "$PROJECT_ROOT/backend" run build

log "Install dependencies and build bot"
npm --prefix "$PROJECT_ROOT/bot" ci
npm --prefix "$PROJECT_ROOT/bot" run build

log "Install dependencies and build frontend"
npm --prefix "$PROJECT_ROOT/frontend" ci
npm --prefix "$PROJECT_ROOT/frontend" run build

log "Redeploy admin (Docker)"
docker compose -f "$PROJECT_ROOT/admin/docker-compose.yaml" up -d --build

log "Redeploy PM2 services"
pm2_restart_or_start "backend" "$PROJECT_ROOT/backend/dist/main.js" --name "backend" --cwd "$PROJECT_ROOT/backend" -i 1
pm2_restart_or_start "bot" "$PROJECT_ROOT/bot/dist/bot.js" --name "bot" --cwd "$PROJECT_ROOT/bot" -i 1
pm2_restart_or_start "frontend" npm --name "frontend" --cwd "$PROJECT_ROOT" -- start --prefix "$PROJECT_ROOT/frontend"

log "Save PM2 process list"
pm2 save

log "Done. Current process status:"
pm2 status
