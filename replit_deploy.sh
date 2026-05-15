#!/usr/bin/env bash
set -e

echo "=== Starting Replit Deployment Setup ==="

# 1. Install uv if not present
# On Replit, we'll install it to a local bin directory
export PATH="$HOME/.local/bin:$PATH"
export LD_LIBRARY_PATH="/nix/store/$(ls /nix/store | grep -m1 gcc-.*-lib)/lib:$LD_LIBRARY_PATH"

if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    # Install to $HOME/.local/bin which is usually writable on Replit
    curl -LsSf https://astral.sh/uv/install.sh | UV_INSTALL_DIR="$HOME/.local/bin" sh
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
