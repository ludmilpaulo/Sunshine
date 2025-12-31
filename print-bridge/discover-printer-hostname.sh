#!/bin/bash

echo "🔍 Descobrindo Hostname da Impressora"
echo "======================================"
echo ""

# Method 1: mDNS/Bonjour service discovery
echo "1️⃣ Procurando impressoras via mDNS/Bonjour..."
if command -v dns-sd > /dev/null; then
    echo "   Escaneando serviços de impressão..."
    timeout 5 dns-sd -B _printer._tcp local. 2>&1 | grep -E "printer|Printer" | head -10 || echo "   Nenhum serviço encontrado via mDNS"
else
    echo "   ⚠️  dns-sd não disponível (macOS apenas)"
fi
echo ""

# Method 2: Check ARP table for printer-like devices
echo "2️⃣ Verificando dispositivos na rede local..."
if command -v arp > /dev/null; then
    echo "   Dispositivos na tabela ARP:"
    arp -a | grep -E "printer|epson|star|pos|receipt" -i | head -5 || echo "   Nenhum dispositivo de impressora encontrado"
else
    echo "   ⚠️  comando arp não disponível"
fi
echo ""

# Method 3: Network scan for common printer ports
echo "3️⃣ Escaneando rede local para portas de impressora..."
echo "   Isso pode levar alguns segundos..."

# Get local IP to determine subnet
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
fi

if [ -n "$LOCAL_IP" ]; then
    SUBNET=$(echo $LOCAL_IP | cut -d. -f1-3)
    echo "   Subnet detectado: $SUBNET.x"
    echo "   Escaneando portas 9100 (ESC/POS)..."
    
    FOUND=0
    for i in {1..50}; do
        IP="${SUBNET}.${i}"
        if [ "$IP" != "$LOCAL_IP" ]; then
            if nc -zv -w 1 "$IP" 9100 2>&1 | grep -q "succeeded"; then
                echo "   ✅ Impressora encontrada em: $IP:9100"
                FOUND=1
                
                # Try to resolve hostname
                HOSTNAME=$(nslookup $IP 2>/dev/null | grep "name" | awk '{print $4}' | head -1)
                if [ -n "$HOSTNAME" ]; then
                    echo "   📛 Hostname: $HOSTNAME"
                fi
            fi
        fi
    done
    
    if [ $FOUND -eq 0 ]; then
        echo "   ⚠️  Nenhuma impressora encontrada na porta 9100"
    fi
else
    echo "   ⚠️  Não foi possível determinar subnet local"
fi
echo ""

# Method 4: Check system printer list
echo "4️⃣ Verificando impressoras instaladas no sistema..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "   Impressoras CUPS:"
    lpstat -p 2>/dev/null | grep -E "printer|Printer" | head -5 || echo "   Nenhuma impressora encontrada"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    lpstat -p 2>/dev/null | head -5 || echo "   Nenhuma impressora encontrada"
else
    echo "   Sistema não suportado para esta verificação"
fi
echo ""

# Method 5: Instructions
echo "5️⃣ Como descobrir manualmente:"
echo ""
echo "   📋 No menu da impressora:"
echo "      1. Acesse: Configurações → Rede → Informações de Rede"
echo "      2. Procure por: 'Hostname', 'Nome do Dispositivo', ou 'Device Name'"
echo "      3. Anote o nome (ex: EPSON-ABC123, printer, POS-Printer)"
echo ""
echo "   📋 Formato comum de hostname:"
echo "      - printer.local"
echo "      - epson-printer.local"
echo "      - EPSON-ABC123.local"
echo "      - star-printer.local"
echo ""
echo "   📋 Testar hostname:"
echo "      ping printer.local"
echo "      nslookup printer.local"
echo ""

echo "✅ Descoberta concluída!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Use o hostname encontrado: ./start-lan.sh HOSTNAME.local"
echo "   2. Ou use o IP encontrado: ./start-lan.sh IP 9100"
echo "   3. Teste: curl http://localhost:3333/discover"

