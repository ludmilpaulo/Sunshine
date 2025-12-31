#!/bin/bash

# Script para testar conexão com impressora LAN
# Uso: ./test-lan-connection.sh [IP] [PORT]

IP=${1:-${PRINTER_LAN_IP:-"192.168.1.100"}}
PORT=${2:-${PRINTER_LAN_PORT:-"9100"}}

echo "🧪 Testando Conexão com Impressora LAN"
echo "========================================"
echo ""
echo "📡 IP: $IP"
echo "🔌 Porta: $PORT"
echo ""

# Test 1: Ping
echo "1️⃣ Testando ping..."
if ping -c 1 -W 1 "$IP" > /dev/null 2>&1; then
    echo "   ✅ Impressora responde ao ping"
else
    echo "   ⚠️  Impressora não responde ao ping (pode estar desligada ou com firewall)"
fi
echo ""

# Test 2: Port connectivity
echo "2️⃣ Testando porta $PORT..."
if command -v nc > /dev/null; then
    if nc -zv -w 2 "$IP" "$PORT" 2>&1 | grep -q "succeeded"; then
        echo "   ✅ Porta $PORT está aberta e acessível"
    else
        echo "   ❌ Porta $PORT não está acessível"
        echo "   Verifique se a impressora está ligada e na rede"
    fi
elif command -v telnet > /dev/null; then
    timeout 2 telnet "$IP" "$PORT" 2>&1 | grep -q "Connected" && \
        echo "   ✅ Porta $PORT está aberta" || \
        echo "   ❌ Porta $PORT não está acessível"
else
    echo "   ⚠️  Ferramentas de teste não disponíveis (nc ou telnet)"
fi
echo ""

# Test 3: Print Bridge health
echo "3️⃣ Testando Print Bridge..."
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "   ✅ Print Bridge está rodando"
    HEALTH=$(curl -s http://localhost:3333/health)
    echo "   Resposta: $HEALTH"
else
    echo "   ❌ Print Bridge não está rodando"
    echo "   Execute: ./start-lan.sh $IP $PORT"
fi
echo ""

# Test 4: List printers
echo "4️⃣ Listando impressoras configuradas..."
if curl -s http://localhost:3333/printers > /dev/null 2>&1; then
    PRINTERS=$(curl -s http://localhost:3333/printers)
    echo "   Impressoras:"
    echo "$PRINTERS" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS"
else
    echo "   ⚠️  Não foi possível listar impressoras"
fi
echo ""

echo "✅ Teste concluído!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Se ping falhou: Verifique se impressora está ligada e na rede"
echo "   2. Se porta falhou: Verifique firewall e configurações da impressora"
echo "   3. Se Print Bridge não está rodando: Execute ./start-lan.sh $IP $PORT"
echo "   4. Teste impressão: curl -X POST http://localhost:3333/print ..."

