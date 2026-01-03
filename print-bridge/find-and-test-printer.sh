#!/bin/bash

echo "========================================"
echo "BUSCAR IMPRESSORA E TESTAR IMPRESSÃO"
echo "========================================"
echo ""

# Verificar se Print Bridge está rodando
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "⚠️  Print Bridge não está rodando!"
    echo "Iniciando Print Bridge..."
    cd "$(dirname "$0")"
    node dist/index.js > /tmp/print-bridge-find.log 2>&1 &
    PRINT_BRIDGE_PID=$!
    sleep 3
    CLEANUP=true
else
    CLEANUP=false
fi

echo "🔍 Buscando impressora na rede..."
echo ""

# Descobrir IP local e sub-rede
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Não foi possível determinar IP local"
    echo "Por favor, forneça o IP da impressora manualmente"
    exit 1
fi

SUBNET=$(echo $LOCAL_IP | cut -d'.' -f1-3)
echo "Rede local: $SUBNET.x"
echo "Escaneando portas 9100 e 9101..."
echo ""

FOUND_IP=""
FOUND_PORT=""

# Função para testar IP e porta
test_printer() {
    local ip=$1
    local port=$2
    if timeout 1 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
        echo "✅ Impressora encontrada em: $ip:$port"
        FOUND_IP=$ip
        FOUND_PORT=$port
        return 0
    fi
    return 1
}

# Escanear IPs 1-100 na rede
for i in {1..100}; do
    IP="$SUBNET.$i"
    
    # Pular nosso próprio IP
    if [ "$IP" = "$LOCAL_IP" ]; then
        continue
    fi
    
    # Testar porta 9100
    if test_printer "$IP" 9100; then
        break
    fi
    
    # Testar porta 9101
    if test_printer "$IP" 9101; then
        break
    fi
done

if [ -z "$FOUND_IP" ]; then
    echo ""
    echo "❌ Nenhuma impressora encontrada automaticamente"
    echo ""
    echo "Por favor, descubra o IP manualmente:"
    echo "1. Acesse o menu da impressora (botões no painel)"
    echo "2. Procure: 'Network Settings' ou 'TCP/IP' ou 'Network Info'"
    echo "3. Anote o IP que aparece"
    echo ""
    read -p "Digite o IP da impressora (ou Enter para cancelar): " MANUAL_IP
    
    if [ -z "$MANUAL_IP" ]; then
        echo "Cancelado."
        [ "$CLEANUP" = true ] && kill $PRINT_BRIDGE_PID 2>/dev/null
        exit 0
    fi
    
    FOUND_IP=$MANUAL_IP
    FOUND_PORT=9100
    
    # Testar conexão
    echo ""
    echo "🔍 Testando conexão com $FOUND_IP:$FOUND_PORT..."
    if ! test_printer "$FOUND_IP" "$FOUND_PORT"; then
        echo "⚠️  Porta 9100 não responde, tentando 9101..."
        FOUND_PORT=9101
        if ! test_printer "$FOUND_IP" "$FOUND_PORT"; then
            echo "❌ Não foi possível conectar à impressora"
            [ "$CLEANUP" = true ] && kill $PRINT_BRIDGE_PID 2>/dev/null
            exit 1
        fi
    fi
fi

echo ""
echo "========================================"
echo "TESTE DE IMPRESSÃO"
echo "========================================"
echo ""
echo "IP: $FOUND_IP"
echo "Porta: $FOUND_PORT"
echo ""

# Criar payload de teste
TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "LAN",
  "lan": {
    "ip": "$FOUND_IP",
    "port": $FOUND_PORT
  },
  "receipt": {
    "shopName": "Test Shop",
    "saleNumber": "TEST-001",
    "date": "$(date '+%Y-%m-%d %H:%M:%S')",
    "subtotal": "10.00",
    "tax": "0.00",
    "total": "10.00",
    "items": [
      {
        "name": "Test Item",
        "qty": 1,
        "unitPrice": "10.00",
        "total": "10.00"
      }
    ]
  },
  "cut": true,
  "openCashDrawer": false
}
EOF
)

echo "🖨️  Enviando teste de impressão..."
echo ""

# Enviar para Print Bridge
RESPONSE=$(curl -s -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

# Verificar resposta
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Impressão enviada com sucesso!"
    echo ""
    echo "Resposta:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "🎉 Verifique se a impressora imprimiu o recibo de teste!"
    echo ""
    echo "💡 Para usar esta impressora, adicione ao arquivo .env:"
    echo "   PRINTER_LAN_IP=$FOUND_IP"
    echo "   PRINTER_LAN_PORT=$FOUND_PORT"
else
    echo "❌ Erro ao imprimir"
    echo ""
    echo "Resposta:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Verifique:"
    echo "  - Se a impressora está ligada"
    echo "  - Se o IP está correto"
    echo "  - Se a porta está correta"
fi

# Limpar se iniciou Print Bridge
if [ "$CLEANUP" = true ]; then
    echo ""
    echo "Parando Print Bridge..."
    kill $PRINT_BRIDGE_PID 2>/dev/null
fi

echo ""
echo "========================================"
echo "CONCLUÍDO"
echo "========================================"

