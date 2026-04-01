#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT_DIR/.pids"
mkdir -p "$PID_DIR"

echo "=== Starting Chatbot PoC ==="

# ── Check setup ──
if [ ! -d "$ROOT_DIR/backend/.venv" ]; then
  echo "Error: Backend not set up. Run ./setup.sh first."
  exit 1
fi

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "Error: Frontend not set up. Run ./setup.sh first."
  exit 1
fi

# ── Kill any existing processes on our ports ──
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# ── Start backend ──
echo "Starting backend on http://localhost:8000 ..."
cd "$ROOT_DIR/backend"
uv run uvicorn app.main:app --reload --port 8000 > "$ROOT_DIR/.pids/backend.log" 2>&1 &
echo $! > "$PID_DIR/backend.pid"

# ── Start frontend ──
echo "Starting frontend on http://localhost:3000 ..."
cd "$ROOT_DIR/frontend"
BROWSER=none npm start > "$ROOT_DIR/.pids/frontend.log" 2>&1 &
echo $! > "$PID_DIR/frontend.pid"

# ── Wait for backend to be ready ──
echo "Waiting for backend to load (embedding model may take a minute)..."
for i in $(seq 1 120); do
  if curl -s --max-time 2 http://localhost:8000/health >/dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  if [ "$i" -eq 120 ]; then
    echo "Warning: Backend did not respond within 2 minutes. Check .pids/backend.log"
  fi
  sleep 2
done

# ── Wait for frontend ──
for i in $(seq 1 30); do
  if curl -s --max-time 2 http://localhost:3000 >/dev/null 2>&1; then
    echo "Frontend is ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Warning: Frontend did not respond within 1 minute. Check .pids/frontend.log"
  fi
  sleep 2
done

echo ""
echo "=== App is running ==="
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Logs:      .pids/backend.log, .pids/frontend.log"
echo "  Stop with: ./stop.sh"
