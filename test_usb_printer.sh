#!/bin/bash

# Script para testar impressora USB Go Infinity

echo "🖨️  Testando Impressora Go Infinity via USB"
echo "==========================================="
echo ""

# Verificar Print Bridge
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "❌ Print Bridge não está rodando"
    echo "   Iniciando Print Bridge em modo USB..."
    cd print-bridge
    PORT=3333 PRINTER_MODE=USB npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
    sleep 5
    cd ..
    
    if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo "❌ Erro ao iniciar Print Bridge"
        exit 1
    fi
fi

echo "✅ Print Bridge está rodando"
echo ""

# Listar impressoras
echo "📋 Impressoras disponíveis:"
PRINTERS=$(curl -s http://localhost:3333/printers)
echo "$PRINTERS" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS"
echo ""

# Tentar descobrir nome da impressora
PRINTER_NAME=$(echo "$PRINTERS" | python3 -c "import sys, json; data=json.load(sys.stdin); printers=data.get('printers', []); usb_printers=[p for p in printers if p.get('type')=='USB']; print(usb_printers[0]['name'] if usb_printers else '')" 2>/dev/null)

if [ -z "$PRINTER_NAME" ]; then
    # Tentar nomes comuns
    PRINTER_NAME="GOINFINITY Thermal Receipt Printer"
    echo "⚠️  Nome da impressora não detectado automaticamente"
    echo "   Tentando com nome padrão: $PRINTER_NAME"
    echo ""
    echo "💡 Se não funcionar, verifique o nome exato da impressora:"
    echo "   lpstat -p -d"
    echo ""
fi

echo "🧪 Testando impressão com: $PRINTER_NAME"
echo ""

TEST_RECEIPT='{
  "mode": "USB",
  "usb": {
    "printerName": "'"$PRINTER_NAME"'"
  },
  "receipt": {
    "shopName": "Sunshine POS",
    "shopPhone": "244 9XX XXX XXX",
    "shopAddress": "Luanda, Angola",
    "saleNumber": "USB-TEST-'$(date +%s)'",
    "date": "'$(date "+%d/%m/%Y %H:%M:%S")'",
    "subtotal": "AOA 1.500,00",
    "tax": "AOA 150,00",
    "total": "AOA 1.650,00",
    "items": [
      {
        "name": "Teste USB Go Infinity",
        "qty": 1,
        "unitPrice": "AOA 1.500,00",
        "total": "AOA 1.500,00"
      }
    ],
    "footer": "Teste USB - Obrigado!"
  },
  "cut": true,
  "openCashDrawer": false
}'

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_RECEIPT" \
  http://localhost:3333/print)

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Recibo de teste enviado com sucesso!"
    echo ""
    echo "📄 Verifique se a impressora Go Infinity imprimiu o recibo"
    echo ""
    echo "✅ Configuração USB concluída!"
else
    echo "❌ Erro ao imprimir:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "💡 Dicas:"
    echo "   1. Verifique se a impressora está ligada e conectada via USB"
    echo "   2. Verifique se o driver está instalado"
    echo "   3. Verifique o nome exato da impressora:"
    echo "      lpstat -p -d"
    echo "   4. Tente configurar manualmente com o nome correto"
fi

echo ""

