#!/bin/bash

# Start Print Bridge Service
# This script ensures Print Bridge is running

cd "$(dirname "$0")"

echo "🚀 Starting Print Bridge..."

# Kill any existing instance
lsof -ti:3333 | xargs kill -9 2>/dev/null
sleep 1

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start Print Bridge
if [ -f "dist/index.js" ]; then
    echo "✅ Starting from compiled version..."
    node dist/index.js
else
    echo "⚠️  Compiled version not found. Building..."
    npm run build
    node dist/index.js
fi

