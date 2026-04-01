#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Chatbot PoC Setup ==="

# ── Check prerequisites ──
for cmd in uv node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is not installed. Please install it first."
    exit 1
  fi
done

echo "Prerequisites OK (uv, node, npm)"

# ── Backend ──
echo ""
echo "--- Installing backend packages ---"
cd "$ROOT_DIR/backend"
uv sync

# ── Backend .env ──
if [ ! -f .env ]; then
  echo ""
  echo "--- Creating backend/.env ---"
  cat > .env <<'EOF'
# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Chatbot API

# CORS Configuration
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
CHROMA_DB_PATH=./chroma_db
DISABLE_TELEMETRY=true

# AI Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Embedding Model
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Chat Configuration
MAX_TOKENS=500
TEMPERATURE=0.7
TOP_P=1.0
N_RESULTS=5

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET_KEY=change-me-to-a-secure-secret-key-32b
EOF
  echo "Created backend/.env — edit GROQ_API_KEY before running!"
else
  echo "backend/.env already exists, skipping."
fi

# ── Frontend ──
echo ""
echo "--- Installing frontend packages ---"
cd "$ROOT_DIR/frontend"
npm install

# ── Scraper ──
echo ""
echo "--- Installing scraper packages ---"
cd "$ROOT_DIR/scraper"
uv sync

echo ""
echo "=== Setup complete ==="
echo "  1. Edit backend/.env and set your GROQ_API_KEY"
echo "  2. Run ./start.sh to start the app"
