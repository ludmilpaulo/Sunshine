#!/bin/bash

# Script to check if Print Bridge is running and start it if not
# Can be run automatically or manually

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_NAME="com.sunshine.printbridge"
PLIST_PATH="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"

# Check if Print Bridge is running
check_running() {
    if curl -s http://localhost:3333/health > /dev/null 2>&1; then
        return 0  # Running
    else
        return 1  # Not running
    fi
}

# Start Print Bridge service (macOS)
start_service_mac() {
    if [ -f "$PLIST_PATH" ]; then
        echo "✅ Serviço encontrado, iniciando..."
        launchctl load "$PLIST_PATH" 2>/dev/null
        launchctl start "$SERVICE_NAME" 2>/dev/null
        sleep 2
        if check_running; then
            echo "✅ Print Bridge iniciado com sucesso!"
            return 0
        fi
    fi
    return 1
}

# Try to start manually (fallback)
start_manually() {
    echo "Tentando iniciar manualmente..."
    cd "$SCRIPT_DIR"
    if [ -f "dist/index.js" ]; then
        nohup node dist/index.js > print-bridge.log 2>&1 &
        sleep 2
        if check_running; then
            echo "✅ Print Bridge iniciado manualmente!"
            return 0
        fi
    fi
    return 1
}

# Main
if check_running; then
    echo "✅ Print Bridge já está rodando"
    exit 0
fi

echo "⚠️  Print Bridge não está rodando"
echo "Tentando iniciar..."

# Try service first (macOS/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if start_service_mac; then
        exit 0
    fi
fi

# Try manual start
if start_manually; then
    exit 0
fi

echo "❌ Não foi possível iniciar o Print Bridge automaticamente"
echo ""
echo "Por favor, execute manualmente:"
echo "  cd $SCRIPT_DIR"
echo "  npm start"
echo ""
echo "Ou instale como serviço:"
echo "  ./install-auto-start.sh"
exit 1

