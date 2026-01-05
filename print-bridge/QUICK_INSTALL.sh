#!/bin/bash

# Quick Install Script - Installs and starts Print Bridge automatically
# Works on macOS, Linux, and Windows (via WSL or Git Bash)

echo "========================================"
echo "🚀 INSTALAÇÃO RÁPIDA - PRINT BRIDGE"
echo "========================================"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo ""
    echo "Por favor, instale Node.js primeiro:"
    echo "  https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(which node)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
    echo "✅ Dependências instaladas"
    echo ""
fi

# Build if needed
if [ ! -f "dist/index.js" ]; then
    echo "🔨 Compilando Print Bridge..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao compilar"
        exit 1
    fi
    echo "✅ Compilado com sucesso"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Criando arquivo .env..."
    cat > .env << EOF
PORT=3333
CORS_ORIGIN_ALLOW_ALL=true
EOF
    echo "✅ Arquivo .env criado"
    echo "⚠️  Configure a impressora no arquivo .env depois"
    echo ""
fi

# Detect OS and install service
OS="$(uname -s)"
case "${OS}" in
    Linux*)     
        echo "🐧 Linux detectado"
        if [ "$EUID" -eq 0 ]; then
            ./install-service-linux.sh
        else
            echo "⚠️  Execute com sudo para instalar como serviço:"
            echo "  sudo ./install-service-linux.sh"
            echo ""
            echo "Ou inicie manualmente:"
            echo "  npm start"
        fi
        ;;
    Darwin*)    
        echo "🍎 macOS detectado"
        ./install-service-mac.sh <<< "s"
        ;;
    *)
        echo "⚠️  Sistema operacional: $OS"
        echo ""
        echo "Para Windows, execute:"
        echo "  install-service-windows.bat"
        echo ""
        echo "Ou inicie manualmente:"
        echo "  npm start"
        ;;
esac

echo ""
echo "========================================"
echo "✅ INSTALAÇÃO CONCLUÍDA"
echo "========================================"
echo ""
echo "Testando Print Bridge..."
sleep 2

if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "✅ Print Bridge está rodando!"
    echo ""
    echo "Teste acessando: http://localhost:3333/health"
else
    echo "⚠️  Print Bridge pode não estar rodando ainda"
    echo ""
    echo "Para iniciar manualmente:"
    echo "  cd $SCRIPT_DIR"
    echo "  npm start"
    echo ""
    echo "Ou instale como serviço (se ainda não instalou):"
    case "${OS}" in
        Linux*) echo "  sudo ./install-service-linux.sh" ;;
        Darwin*) echo "  ./install-service-mac.sh" ;;
        *) echo "  install-service-windows.bat" ;;
    esac
fi

