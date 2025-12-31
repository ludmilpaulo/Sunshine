#!/bin/bash

# Script para configurar impressora com IP fornecido

if [ -z "$1" ]; then
    echo "Uso: ./configure_printer_with_ip.sh [IP_DA_IMPRESSORA]"
    echo "Exemplo: ./configure_printer_with_ip.sh 192.168.100.50"
    exit 1
fi

PRINTER_IP=$1
PRINTER_PORT=${2:-9100}

echo "🖨️  Configurando Impressora Go Infinity"
echo "========================================"
echo ""
echo "IP: $PRINTER_IP"
echo "Porta: $PRINTER_PORT"
echo ""

# Verificar Print Bridge
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "📡 Iniciando Print Bridge..."
    cd print-bridge
    PORT=3333 PRINTER_LAN_IP="$PRINTER_IP" PRINTER_LAN_PORT="$PRINTER_PORT" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
    sleep 5
    cd ..
else
    echo "🔄 Reiniciando Print Bridge com novo IP..."
    pkill -f "tsx src/index.ts" 2>/dev/null
    sleep 2
    cd print-bridge
    PORT=3333 PRINTER_LAN_IP="$PRINTER_IP" PRINTER_LAN_PORT="$PRINTER_PORT" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
    sleep 5
    cd ..
fi

if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "✅ Print Bridge configurado!"
    echo ""
    echo "🧪 Testando impressão..."
    echo ""
    
    TEST_RECEIPT='{
      "mode": "LAN",
      "lan": {
        "ip": "'"$PRINTER_IP"'",
        "port": '"$PRINTER_PORT"'
      },
      "receipt": {
        "shopName": "Sunshine POS",
        "shopPhone": "244 9XX XXX XXX",
        "shopAddress": "Luanda, Angola",
        "saleNumber": "TEST-'$(date +%s)'",
        "date": "'$(date "+%d/%m/%Y %H:%M:%S")'",
        "subtotal": "AOA 1.500,00",
        "tax": "AOA 150,00",
        "total": "AOA 1.650,00",
        "items": [
          {
            "name": "Teste de Configuração",
            "qty": 1,
            "unitPrice": "AOA 1.500,00",
            "total": "AOA 1.500,00"
          }
        ],
        "footer": "Configuração concluída - Obrigado!"
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
        echo "✅ Configuração concluída!"
    else
        echo "❌ Erro ao imprimir:"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        echo ""
        echo "💡 Verifique:"
        echo "   - Se a impressora está ligada"
        echo "   - Se o IP está correto: $PRINTER_IP"
        echo "   - Se a porta $PRINTER_PORT está acessível"
        echo "   - Teste: nc -zv $PRINTER_IP $PRINTER_PORT"
    fi
else
    echo "❌ Erro ao iniciar Print Bridge"
    echo "   Logs: tail -f /tmp/print-bridge.log"
fi

echo ""
echo "📝 Para usar no futuro:"
echo "   cd print-bridge"
echo "   PORT=3333 PRINTER_LAN_IP=\"$PRINTER_IP\" PRINTER_LAN_PORT=$PRINTER_PORT npx tsx src/index.ts"
echo ""

