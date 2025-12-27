#!/bin/bash

# Start Print Bridge script
echo "🚀 Starting Print Bridge..."
echo "📍 Service will run on http://localhost:3333"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start the service
echo "▶️  Starting Print Bridge server..."
npm run dev

