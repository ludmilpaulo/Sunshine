#!/bin/bash

echo "========================================"
echo "TESTE DE IMPRESSÃO LAN"
echo "========================================"
echo ""

# Verificar se Print Bridge está rodando
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "⚠️  Print Bridge não está rodando!"
    echo ""
    echo "Iniciando Print Bridge..."
    cd "$(dirname "$0")"
    node dist/index.js > /tmp/print-bridge-test.log 2>&1 &
    PRINT_BRIDGE_PID=$!
    sleep 3
    
    if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo "❌ Erro ao iniciar Print Bridge"
        echo "Verifique os logs: tail -f /tmp/print-bridge-test.log"
        exit 1
    fi
    
    echo "✅ Print Bridge iniciado"
    echo ""
    CLEANUP=true
else
    CLEANUP=false
    echo "✅ Print Bridge está rodando"
    echo ""
fi

# Obter IP da impressora
if [ -n "$1" ]; then
    PRINTER_IP="$1"
else
    # Tentar descobrir do .env
    if [ -f .env ]; then
        PRINTER_IP=$(grep "^PRINTER_LAN_IP=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    
    if [ -z "$PRINTER_IP" ]; then
        echo "Por favor, forneça o IP da impressora:"
        echo "  $0 <IP_DA_IMPRESSORA>"
        echo ""
        echo "Exemplo:"
        echo "  $0 192.168.1.50"
        echo ""
        exit 1
    fi
fi

# Obter porta (padrão 9100)
if [ -n "$2" ]; then
    PRINTER_PORT="$2"
else
    if [ -f .env ]; then
        PRINTER_PORT=$(grep "^PRINTER_LAN_PORT=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    PRINTER_PORT=${PRINTER_PORT:-9100}
fi

echo "Configuração:"
echo "  IP: $PRINTER_IP"
echo "  Porta: $PRINTER_PORT"
echo ""

# Testar conexão
echo "🔍 Testando conexão..."
if ping -c 1 -W 2 "$PRINTER_IP" > /dev/null 2>&1; then
    echo "✅ Ping OK"
else
    echo "⚠️  Ping falhou (pode ser normal se ping estiver desabilitado)"
fi

# Testar porta
if nc -zv -w 2 "$PRINTER_IP" "$PRINTER_PORT" > /dev/null 2>&1; then
    echo "✅ Porta $PRINTER_PORT acessível"
else
    echo "⚠️  Porta $PRINTER_PORT não acessível"
    echo "   Tentando porta alternativa 9101..."
    if nc -zv -w 2 "$PRINTER_IP" 9101 > /dev/null 2>&1; then
        echo "✅ Porta 9101 acessível"
        PRINTER_PORT=9101
    else
        echo "❌ Nenhuma porta acessível"
        echo "   Verifique se a impressora está ligada e conectada à rede"
        [ "$CLEANUP" = true ] && kill $PRINT_BRIDGE_PID 2>/dev/null
        exit 1
    fi
fi

echo ""
echo "🖨️  Enviando teste de impressão..."
echo ""

# Criar payload de teste
TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "LAN",
  "lan": {
    "ip": "$PRINTER_IP",
    "port": $PRINTER_PORT
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
    echo "Verifique se a impressora imprimiu o recibo de teste."
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
    echo "  - Logs do Print Bridge: tail -f /tmp/print-bridge-test.log"
fi

# Limpar se iniciou Print Bridge
if [ "$CLEANUP" = true ]; then
    echo ""
    echo "Parando Print Bridge..."
    kill $PRINT_BRIDGE_PID 2>/dev/null
fi

echo ""
echo "========================================"
echo "TESTE CONCLUÍDO"
echo "========================================"

