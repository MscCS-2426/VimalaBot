#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT_DIR/.pids"

echo "=== Stopping Chatbot PoC ==="

stopped=0

# ── Stop by PID files ──
for service in backend frontend; do
  pid_file="$PID_DIR/$service.pid"
  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping $service (PID $pid)..."
      kill "$pid" 2>/dev/null
      # Wait briefly then force kill if needed
      sleep 1
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
      stopped=$((stopped + 1))
    fi
    rm -f "$pid_file"
  fi
done

# ── Also kill by port as fallback ──
for port in 8000 3000; do
  pids=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Killing processes on port $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    stopped=$((stopped + 1))
  fi
done

if [ "$stopped" -eq 0 ]; then
  echo "No running processes found."
else
  echo "Stopped."
fi
