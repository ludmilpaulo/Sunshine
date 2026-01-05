#!/bin/bash

# Script para iniciar Print Bridge em produção

echo "========================================"
echo "🚀 INICIANDO PRINT BRIDGE - PRODUÇÃO"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Criando .env com configurações padrão..."
    cat > .env << EOF
PORT=3333
PRINTER_USB_NAME=_USB_Receipt_Printer
CORS_ORIGIN_ALLOW_ALL=true
EOF
    echo "✅ .env criado"
fi

# Verificar se CORS está configurado
if ! grep -q "CORS_ORIGIN_ALLOW_ALL" .env; then
    echo "⚠️  CORS_ORIGIN_ALLOW_ALL não configurado"
    echo "   Adicionando CORS_ORIGIN_ALLOW_ALL=true..."
    echo "CORS_ORIGIN_ALLOW_ALL=true" >> .env
    echo "✅ CORS configurado"
fi

# Verificar se PRINTER_USB_NAME está configurado
if ! grep -q "PRINTER_USB_NAME" .env; then
    echo "⚠️  PRINTER_USB_NAME não configurado"
    echo "   Adicionando PRINTER_USB_NAME=_USB_Receipt_Printer..."
    echo "PRINTER_USB_NAME=_USB_Receipt_Printer" >> .env
    echo "✅ PRINTER_USB_NAME configurado"
fi

echo ""
echo "Configuração atual:"
cat .env
echo ""

# Verificar se já está rodando
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "✅ Print Bridge já está rodando"
    echo ""
    echo "Para reiniciar, pare o processo atual e execute novamente:"
    echo "  pkill -f 'tsx src/index.ts'"
    echo "  pkill -f 'node.*print-bridge'"
    exit 0
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Build se necessário
if [ ! -d "dist" ]; then
    echo "🔨 Fazendo build..."
    npm run build
fi

echo ""
echo "🚀 Iniciando Print Bridge..."
echo ""

# Iniciar em produção
npm start

