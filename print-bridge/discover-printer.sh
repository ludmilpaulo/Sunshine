#!/bin/bash

echo "========================================"
echo "DESCOBRIR IMPRESSORA NA REDE"
echo "========================================"
echo ""

# Verificar se Print Bridge está rodando
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "⚠️  Print Bridge não está rodando!"
    echo ""
    echo "Iniciando Print Bridge em segundo plano..."
    cd "$(dirname "$0")"
    node dist/index.js > /tmp/print-bridge-discovery.log 2>&1 &
    PRINT_BRIDGE_PID=$!
    sleep 3
    
    if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo "❌ Erro ao iniciar Print Bridge"
        exit 1
    fi
    
    echo "✅ Print Bridge iniciado (PID: $PRINT_BRIDGE_PID)"
    echo ""
    CLEANUP=true
else
    CLEANUP=false
fi

echo "🔍 Descobrindo impressora na rede..."
echo ""

# Tentar auto-discovery
DISCOVERY_RESULT=$(curl -s http://localhost:3333/discover)

if echo "$DISCOVERY_RESULT" | grep -q '"success":true'; then
    echo "✅ Impressora encontrada!"
    echo ""
    echo "$DISCOVERY_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DISCOVERY_RESULT"
    echo ""
    
    # Extrair IP
    PRINTER_IP=$(echo "$DISCOVERY_RESULT" | grep -o '"ip":"[^"]*"' | cut -d'"' -f4)
    PRINTER_PORT=$(echo "$DISCOVERY_RESULT" | grep -o '"port":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$PRINTER_IP" ]; then
        echo "========================================"
        echo "CONFIGURAÇÃO SUGERIDA"
        echo "========================================"
        echo ""
        echo "Adicione ao arquivo .env:"
        echo ""
        echo "PRINTER_LAN_IP=$PRINTER_IP"
        if [ -n "$PRINTER_PORT" ]; then
            echo "PRINTER_LAN_PORT=$PRINTER_PORT"
        else
            echo "PRINTER_LAN_PORT=9100"
        fi
        echo ""
        
        read -p "Deseja criar/atualizar o arquivo .env? (s/N): " CREATE_ENV
        if [[ "$CREATE_ENV" =~ ^[Ss]$ ]]; then
            ENV_FILE="$(dirname "$0")/.env"
            
            # Criar .env se não existir
            if [ ! -f "$ENV_FILE" ]; then
                echo "PORT=3333" > "$ENV_FILE"
            fi
            
            # Atualizar ou adicionar PRINTER_LAN_IP
            if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
                sed -i.bak "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$PRINTER_IP|" "$ENV_FILE"
            else
                echo "PRINTER_LAN_IP=$PRINTER_IP" >> "$ENV_FILE"
            fi
            
            # Atualizar ou adicionar PRINTER_LAN_PORT
            PORT_VALUE="${PRINTER_PORT:-9100}"
            if grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
                sed -i.bak "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$PORT_VALUE|" "$ENV_FILE"
            else
                echo "PRINTER_LAN_PORT=$PORT_VALUE" >> "$ENV_FILE"
            fi
            
            echo "✅ Arquivo .env atualizado!"
            echo ""
            echo "Conteúdo do .env:"
            cat "$ENV_FILE"
        fi
    fi
else
    echo "❌ Nenhuma impressora encontrada automaticamente"
    echo ""
    echo "Tentativas alternativas:"
    echo ""
    
    # Listar impressoras disponíveis
    echo "1. Verificando impressoras configuradas..."
    PRINTERS=$(curl -s http://localhost:3333/printers)
    echo "$PRINTERS" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS"
    echo ""
    
    echo "2. Para descobrir manualmente:"
    echo "   a) Acesse o menu da impressora e procure por 'Network Settings'"
    echo "   b) Anote o endereço IP"
    echo "   c) Teste a conexão: ping <IP>"
    echo "   d) Teste a porta: nc -zv <IP> 9100"
    echo "   e) Adicione ao .env: PRINTER_LAN_IP=<IP>"
    echo ""
fi

# Limpar se iniciou Print Bridge
if [ "$CLEANUP" = true ]; then
    echo "Parando Print Bridge..."
    kill $PRINT_BRIDGE_PID 2>/dev/null
fi

echo ""
echo "========================================"
echo "DESCOBERTA CONCLUÍDA"
echo "========================================"

