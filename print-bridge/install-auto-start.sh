#!/bin/bash

# Universal installer script that detects OS and runs appropriate installer
# Works on macOS and Linux (Windows users should use install-service-windows.bat)

echo "========================================"
echo "🚀 INSTALAR PRINT BRIDGE AUTO-START"
echo "========================================"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE="linux" ;;
    Darwin*)    OS_TYPE="macos" ;;
    *)          OS_TYPE="unknown" ;;
esac

echo "Sistema detectado: $OS_TYPE"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$OS_TYPE" = "linux" ]; then
    echo "🐧 Linux detectado - usando systemd"
    echo ""
    if [ "$EUID" -ne 0 ]; then 
        echo "⚠️  Executando com sudo..."
        sudo "$SCRIPT_DIR/install-service-linux.sh"
    else
        "$SCRIPT_DIR/install-service-linux.sh"
    fi
elif [ "$OS_TYPE" = "macos" ]; then
    echo "🍎 macOS detectado - usando launchd"
    echo ""
    "$SCRIPT_DIR/install-service-mac.sh"
else
    echo "❌ Sistema operacional não suportado: $OS"
    echo ""
    echo "Para Windows, execute:"
    echo "  install-service-windows.bat"
    echo ""
    echo "Para Linux, execute:"
    echo "  sudo ./install-service-linux.sh"
    echo ""
    echo "Para macOS, execute:"
    echo "  ./install-service-mac.sh"
    exit 1
fi

