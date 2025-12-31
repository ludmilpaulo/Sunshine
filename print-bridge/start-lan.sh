#!/bin/bash

# Script para iniciar Print Bridge com configuração LAN
# Uso: 
#   ./start-lan.sh                    # Auto-discovery
#   ./start-lan.sh [HOSTNAME]         # Use hostname (recommended)
#   ./start-lan.sh [IP] [PORT]        # Use IP address

cd "$(dirname "$0")"

export PORT=${PORT:-3333}
export PRINTER_MODE="LAN"

# Carrega .env se existir
if [ -f .env ]; then
  echo "📄 Carregando configurações de .env..."
  export $(cat .env | grep -v '^#' | xargs)
fi

# Determine configuration method
if [ -z "$1" ]; then
  # No arguments - try auto-discovery
  echo "🚀 Iniciando Print Bridge com auto-descoberta..."
  echo "   O sistema tentará encontrar a impressora automaticamente"
  echo ""
elif [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  # IP address provided
  PRINTER_IP="$1"
  PRINTER_PORT=${2:-${PRINTER_LAN_PORT:-"9100"}}
  export PRINTER_LAN_IP="${PRINTER_IP}"
  export PRINTER_LAN_PORT="${PRINTER_PORT}"
  echo "🚀 Iniciando Print Bridge com configuração LAN (IP)..."
  echo "📡 Impressora LAN: ${PRINTER_IP}:${PRINTER_PORT}"
  echo ""
else
  # Hostname provided (recommended)
  PRINTER_HOSTNAME="$1"
  export PRINTER_HOSTNAME="${PRINTER_HOSTNAME}"
  export PRINTER_LAN_PORT=${2:-${PRINTER_LAN_PORT:-"9100"}}
  echo "🚀 Iniciando Print Bridge com configuração LAN (hostname)..."
  echo "📡 Impressora Hostname: ${PRINTER_HOSTNAME}"
  echo "   O IP será resolvido automaticamente"
  echo ""
fi

echo "🔧 Configuração:"
echo "   - Modo: LAN"
if [ -n "$PRINTER_LAN_IP" ]; then
  echo "   - IP: ${PRINTER_LAN_IP}"
elif [ -n "$PRINTER_HOSTNAME" ]; then
  echo "   - Hostname: ${PRINTER_HOSTNAME}"
else
  echo "   - Modo: Auto-descoberta"
fi
echo "   - Porta: ${PRINTER_LAN_PORT:-9100}"
echo "   - Servidor: http://localhost:${PORT}"
echo ""

# Tenta iniciar sem o módulo USB (apenas LAN)
echo "▶️  Iniciando servidor..."
npx tsx src/index.ts

