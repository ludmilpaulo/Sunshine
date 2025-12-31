#!/bin/bash

# Script para descobrir IP da impressora Go Infinity e configurar automaticamente

echo "🖨️  Descobrindo e Configurando Impressora Go Infinity"
echo "======================================================"
echo ""

# Verificar Print Bridge
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "❌ Print Bridge não está rodando"
    echo "   Execute: cd print-bridge && PORT=3333 npx tsx src/index.ts"
    exit 1
fi

echo "✅ Print Bridge está rodando"
echo ""

# Pegar rede local
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
NETWORK=$(echo $CURRENT_IP | cut -d. -f1-3)

echo "📡 Rede detectada: ${NETWORK}.0/24"
echo ""
echo "🔍 Escaneando rede em busca da impressora (porta 9100)..."
echo "   Isso pode levar alguns minutos..."
echo ""

FOUND_IP=""

# Testar IPs comuns primeiro
COMMON_IPS=(100 101 102 50 51 52 200 201 202)
for i in "${COMMON_IPS[@]}"; do
    IP="${NETWORK}.${i}"
    echo -n "   Testando ${IP}... "
    
    if timeout 1 bash -c "echo > /dev/tcp/$IP/9100" 2>/dev/null; then
        echo "✅ Porta 9100 aberta!"
        FOUND_IP="$IP"
        break
    else
        echo "❌"
    fi
done

# Se não encontrou, perguntar ao usuário
if [ -z "$FOUND_IP" ]; then
    echo ""
    echo "⚠️  Não foi possível encontrar a impressora automaticamente"
    echo ""
    echo "💡 Opções:"
    echo "   1. Verifique o menu da impressora para o IP"
    echo "   2. Verifique o roteador (dispositivos conectados)"
    echo "   3. Digite o IP manualmente"
    echo ""
    read -p "Digite o IP da impressora (ou pressione Enter para pular): " FOUND_IP
    
    if [ -z "$FOUND_IP" ]; then
        echo ""
        echo "❌ Configuração cancelada"
        echo ""
        echo "Para configurar manualmente depois:"
        echo "   cd print-bridge"
        echo "   PORT=3333 PRINTER_LAN_IP=\"[IP]\" PRINTER_LAN_PORT=9100 npx tsx src/index.ts"
        exit 0
    fi
    
    # Testar o IP fornecido
    echo ""
    echo "🔍 Testando ${FOUND_IP}..."
    if timeout 1 bash -c "echo > /dev/tcp/$FOUND_IP/9100" 2>/dev/null; then
        echo "✅ Porta 9100 acessível!"
    else
        echo "⚠️  Porta 9100 não acessível, mas continuando..."
    fi
fi

echo ""
echo "🚀 Configurando Print Bridge com IP: ${FOUND_IP}"
echo ""

# Parar Print Bridge atual
pkill -f "tsx src/index.ts" 2>/dev/null
sleep 2

# Iniciar com novo IP
cd print-bridge
PORT=3333 PRINTER_LAN_IP="$FOUND_IP" PRINTER_LAN_PORT=9100 npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
PB_PID=$!

echo "   Aguardando Print Bridge iniciar..."
sleep 5

if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "✅ Print Bridge configurado!"
    echo ""
    echo "🧪 Testando impressão..."
    echo ""
    
    TEST_RECEIPT='{
      "mode": "LAN",
      "lan": {
        "ip": "'"$FOUND_IP"'",
        "port": 9100
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
        "footer": "Configuração automática - Obrigado!"
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
        echo ""
        echo "📝 Para usar no futuro:"
        echo "   cd print-bridge"
        echo "   PORT=3333 PRINTER_LAN_IP=\"$FOUND_IP\" PRINTER_LAN_PORT=9100 npx tsx src/index.ts"
    else
        echo "❌ Erro ao imprimir:"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        echo ""
        echo "💡 Verifique:"
        echo "   - Se a impressora está ligada"
        echo "   - Se o IP está correto: $FOUND_IP"
        echo "   - Se a porta 9100 está acessível"
    fi
else
    echo "❌ Erro ao iniciar Print Bridge"
    echo "   Logs: tail -f /tmp/print-bridge.log"
fi

echo ""

