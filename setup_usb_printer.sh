#!/bin/bash

# Script para configurar impressora USB Go Infinity

echo "🖨️  Configuração da Impressora Go Infinity via USB"
echo "====================================================="
echo ""

# Verificar se impressora está conectada
echo "1️⃣ Verificando impressoras conectadas..."
echo ""

# Listar todas as impressoras
ALL_PRINTERS=$(lpstat -p -d 2>/dev/null)
if [ -n "$ALL_PRINTERS" ]; then
    echo "📋 Impressoras encontradas no sistema:"
    echo "$ALL_PRINTERS"
    echo ""
    
    # Tentar encontrar Go Infinity
    GOINFINITY=$(echo "$ALL_PRINTERS" | grep -i "goinfinity\|go infinity\|thermal" || echo "")
    
    if [ -n "$GOINFINITY" ]; then
        PRINTER_NAME=$(echo "$GOINFINITY" | awk '{print $2}')
        echo "✅ Impressora Go Infinity encontrada: $PRINTER_NAME"
    else
        echo "⚠️  Go Infinity não encontrada automaticamente"
        echo ""
        echo "Por favor, digite o nome exato da impressora:"
        read -p "Nome da impressora: " PRINTER_NAME
        
        if [ -z "$PRINTER_NAME" ]; then
            echo "❌ Nome da impressora é obrigatório"
            exit 1
        fi
    fi
else
    echo "⚠️  Nenhuma impressora encontrada no sistema"
    echo ""
    echo "💡 Certifique-se de que:"
    echo "   1. A impressora está ligada"
    echo "   2. A impressora está conectada via USB"
    echo "   3. O driver está instalado"
    echo ""
    read -p "Digite o nome da impressora (ou pressione Enter para usar padrão): " PRINTER_NAME
    
    if [ -z "$PRINTER_NAME" ]; then
        PRINTER_NAME="GOINFINITY Thermal Receipt Printer"
        echo "   Usando nome padrão: $PRINTER_NAME"
    fi
fi

echo ""
echo "2️⃣ Configurando Print Bridge..."
echo ""

# Parar Print Bridge atual
pkill -f "tsx src/index.ts" 2>/dev/null
sleep 2

# Iniciar em modo USB
cd print-bridge
PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME="$PRINTER_NAME" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
PB_PID=$!

echo "   Aguardando Print Bridge iniciar..."
sleep 5

if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "✅ Print Bridge configurado para USB"
    echo "   Impressora: $PRINTER_NAME"
    echo ""
    
    echo "3️⃣ Testando impressão..."
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
        echo "💡 Verifique:"
        echo "   - Se a impressora está ligada e conectada"
        echo "   - Se o driver está instalado corretamente"
        echo "   - Se o nome da impressora está correto: $PRINTER_NAME"
        echo "   - Logs: tail -f /tmp/print-bridge.log"
    fi
else
    echo "❌ Erro ao iniciar Print Bridge"
    echo "   Logs: tail -f /tmp/print-bridge.log"
    exit 1
fi

echo ""
echo "📝 Para usar no futuro:"
echo "   cd print-bridge"
echo "   PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME=\"$PRINTER_NAME\" npx tsx src/index.ts"
echo ""

