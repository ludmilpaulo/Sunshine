#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Iniciando Print Bridge..."
PORT=${PORT:-3333}
npx tsx src/index.ts