#!/usr/bin/env bash
set -e

echo "=== Starting Replit Deployment Setup ==="

# 1. Install uv if not present
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env
fi

# 2. Setup Backend
echo "Setting up backend..."
cd backend
uv sync
# Ensure data directory exists
mkdir -p data

# 3. Build Frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# 4. Return to root
cd ..

# 5. Start Backend (which now serves frontend)
echo "Starting backend on port 8080..."
cd backend
# We use 0.0.0.0 to make it accessible from Replit's proxy
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080
