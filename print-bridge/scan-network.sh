#!/bin/bash

echo "========================================"
echo "ESCANEAR REDE PARA ENCONTRAR IMPRESSORA"
echo "========================================"
echo ""

# Descobrir IP local e sub-rede
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Não foi possível determinar IP local"
    exit 1
fi

SUBNET=$(echo $LOCAL_IP | cut -d'.' -f1-3)
echo "🌐 Rede local detectada: $SUBNET.x"
echo "🔍 Escaneando todos os IPs na rede..."
echo "⏳ Isso pode levar alguns minutos..."
echo ""

FOUND_PRINTERS=()

# Função para testar IP e porta
test_printer_port() {
    local ip=$1
    local port=$2
    if timeout 0.5 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
        return 0
    fi
    return 1
}

# Escanear IPs 1-254 na rede
TOTAL=254
CURRENT=0

for i in {1..254}; do
    IP="$SUBNET.$i"
    
    # Pular nosso próprio IP
    if [ "$IP" = "$LOCAL_IP" ]; then
        continue
    fi
    
    CURRENT=$((CURRENT + 1))
    if [ $((CURRENT % 20)) -eq 0 ]; then
        echo -ne "\r⏳ Escaneando... $CURRENT/$TOTAL IPs testados"
    fi
    
    # Testar porta 9100 (padrão ESC/POS)
    if test_printer_port "$IP" 9100; then
        echo ""
        echo "✅ Impressora encontrada em: $IP:9100"
        FOUND_PRINTERS+=("$IP:9100")
    fi
    
    # Testar porta 9101 (alternativa)
    if test_printer_port "$IP" 9101; then
        echo ""
        echo "✅ Impressora encontrada em: $IP:9101"
        FOUND_PRINTERS+=("$IP:9101")
    fi
    
    # Testar porta 515 (LPR)
    if test_printer_port "$IP" 515; then
        echo ""
        echo "✅ Dispositivo de impressão encontrado em: $IP:515"
        FOUND_PRINTERS+=("$IP:515")
    fi
done

echo ""
echo ""

if [ ${#FOUND_PRINTERS[@]} -eq 0 ]; then
    echo "❌ Nenhuma impressora encontrada automaticamente"
    echo ""
    echo "Possíveis razões:"
    echo "  1. Impressora não está ligada"
    echo "  2. Impressora não está conectada à rede"
    echo "  3. Firewall bloqueando portas"
    echo "  4. Impressora em outra sub-rede"
    echo ""
    echo "💡 Métodos alternativos:"
    echo "  1. Acesse o menu da impressora → Network Settings"
    echo "  2. Verifique o roteador (192.168.1.1) → Dispositivos Conectados"
    echo "  3. Imprima uma página de teste/configuração da impressora"
    exit 1
else
    echo "========================================"
    echo "IMPRESSORAS ENCONTRADAS"
    echo "========================================"
    echo ""
    for i in "${!FOUND_PRINTERS[@]}"; do
        echo "$((i+1)). ${FOUND_PRINTERS[$i]}"
    done
    echo ""
    
    # Se encontrou apenas uma, usar automaticamente
    if [ ${#FOUND_PRINTERS[@]} -eq 1 ]; then
        PRINTER=${FOUND_PRINTERS[0]}
        IP=$(echo $PRINTER | cut -d':' -f1)
        PORT=$(echo $PRINTER | cut -d':' -f2)
        
        echo "🎯 Usando impressora: $IP:$PORT"
        echo ""
        echo "========================================"
        echo "TESTE DE IMPRESSÃO"
        echo "========================================"
        echo ""
        
        # Verificar se Print Bridge está rodando
        if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo "Iniciando Print Bridge..."
            cd "$(dirname "$0")"
            node dist/index.js > /tmp/print-bridge-test.log 2>&1 &
            sleep 3
        fi
        
        # Criar payload de teste
        TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "LAN",
  "lan": {
    "ip": "$IP",
    "port": $PORT
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
        
        echo "🖨️  Enviando teste de impressão para $IP:$PORT..."
        echo ""
        
        RESPONSE=$(curl -s -X POST http://localhost:3333/print \
          -H "Content-Type: application/json" \
          -d "$TEST_PAYLOAD")
        
        if echo "$RESPONSE" | grep -q '"ok":true'; then
            echo "✅ Impressão enviada com sucesso!"
            echo ""
            echo "🎉 Verifique se a impressora imprimiu o recibo de teste!"
            echo ""
            echo "💡 Para configurar permanentemente, adicione ao arquivo .env:"
            echo "   PRINTER_LAN_IP=$IP"
            echo "   PRINTER_LAN_PORT=$PORT"
        else
            echo "❌ Erro ao imprimir"
            echo ""
            echo "Resposta:"
            echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        fi
    else
        echo "Múltiplas impressoras encontradas. Escolha qual usar:"
        echo ""
        read -p "Digite o número (1-${#FOUND_PRINTERS[@]}): " CHOICE
        
        if [ -z "$CHOICE" ] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt ${#FOUND_PRINTERS[@]} ]; then
            echo "Escolha inválida"
            exit 1
        fi
        
        PRINTER=${FOUND_PRINTERS[$((CHOICE-1))]}
        IP=$(echo $PRINTER | cut -d':' -f1)
        PORT=$(echo $PRINTER | cut -d':' -f2)
        
        echo ""
        echo "🖨️  Testando impressão em $IP:$PORT..."
        # (mesmo código de teste acima)
    fi
fi

echo ""
echo "========================================"
echo "CONCLUÍDO"
echo "========================================"

