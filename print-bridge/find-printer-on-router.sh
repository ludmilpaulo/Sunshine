#!/bin/bash

echo "========================================"
echo "BUSCAR IMPRESSORA NO ROTEADOR"
echo "========================================"
echo ""

# Descobrir gateway (roteador)
GATEWAY=$(route -n get default 2>/dev/null | grep gateway | awk '{print $2}')
if [ -z "$GATEWAY" ]; then
    GATEWAY=$(netstat -rn | grep default | awk '{print $2}' | head -1)
fi

if [ -z "$GATEWAY" ]; then
    GATEWAY="192.168.1.1"
    echo "⚠️  Não foi possível detectar gateway, usando padrão: $GATEWAY"
else
    echo "✅ Gateway detectado: $GATEWAY"
fi

echo ""
echo "🔍 Verificando dispositivos na rede..."
echo ""

# Listar todos os IPs ativos via ARP
echo "Dispositivos ativos na rede (ARP):"
echo "-----------------------------------"
arp -a | grep "192.168.1" | grep -v "incomplete" | while read line; do
    IP=$(echo $line | awk '{print $2}' | tr -d '()')
    MAC=$(echo $line | awk '{print $4}')
    NAME=$(echo $line | awk '{print $1}')
    echo "  $IP - $NAME ($MAC)"
done

echo ""
echo "🔍 Testando portas de impressora nos dispositivos ativos..."
echo ""

# Testar portas de impressora em cada IP ativo
FOUND_PRINTERS=()

arp -a | grep "192.168.1" | grep -v "incomplete" | while read line; do
    IP=$(echo $line | awk '{print $2}' | tr -d '()')
    NAME=$(echo $line | awk '{print $1}')
    
    # Pular gateway e nosso próprio IP
    if [ "$IP" = "$GATEWAY" ] || [ "$IP" = "192.168.1.1" ]; then
        continue
    fi
    
    echo -n "  Testando $IP ($NAME)... "
    
    # Testar porta 9100
    if timeout 1 bash -c "echo >/dev/tcp/$IP/9100" 2>/dev/null; then
        echo "✅ IMPRESSORA ENCONTRADA em $IP:9100"
        FOUND_PRINTERS+=("$IP:9100")
        continue
    fi
    
    # Testar porta 9101
    if timeout 1 bash -c "echo >/dev/tcp/$IP/9101" 2>/dev/null; then
        echo "✅ IMPRESSORA ENCONTRADA em $IP:9101"
        FOUND_PRINTERS+=("$IP:9101")
        continue
    fi
    
    echo "❌"
done

echo ""
echo "🔍 Escaneando IPs adicionais na rede..."
echo ""

# Descobrir nossa sub-rede
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
SUBNET=$(echo $LOCAL_IP | cut -d'.' -f1-3)

echo "Escaneando $SUBNET.1-$SUBNET.254 nas portas 9100 e 9101..."
echo "⏳ Isso pode levar alguns minutos..."
echo ""

# Escanear IPs que não aparecem no ARP
for i in {1..254}; do
    IP="$SUBNET.$i"
    
    # Pular IPs já testados
    if arp -a | grep -q "$IP"; then
        continue
    fi
    
    # Testar porta 9100
    if timeout 0.3 bash -c "echo >/dev/tcp/$IP/9100" 2>/dev/null; then
        echo "✅ IMPRESSORA ENCONTRADA em $IP:9100"
        FOUND_PRINTERS+=("$IP:9100")
    fi
    
    # Testar porta 9101
    if timeout 0.3 bash -c "echo >/dev/tcp/$IP/9101" 2>/dev/null; then
        echo "✅ IMPRESSORA ENCONTRADA em $IP:9101"
        FOUND_PRINTERS+=("$IP:9101")
    fi
    
    # Mostrar progresso a cada 50 IPs
    if [ $((i % 50)) -eq 0 ]; then
        echo -ne "\r⏳ Progresso: $i/254 IPs testados"
    fi
done

echo ""
echo ""

if [ ${#FOUND_PRINTERS[@]} -eq 0 ]; then
    echo "❌ Nenhuma impressora encontrada automaticamente"
    echo ""
    echo "💡 Próximos passos:"
    echo ""
    echo "1. Verifique se a impressora está ligada"
    echo "2. Verifique se o cabo RJ45 está conectado"
    echo "3. Acesse o menu da impressora para ver o IP:"
    echo "   - Pressione os botões no painel"
    echo "   - Procure: 'Network Settings' ou 'TCP/IP'"
    echo "   - Anote o IP que aparece"
    echo ""
    echo "4. Ou acesse o roteador:"
    echo "   - Abra navegador: http://$GATEWAY"
    echo "   - Faça login"
    echo "   - Procure: 'Dispositivos Conectados' ou 'DHCP Clients'"
    echo "   - Procure pela impressora GO INFINITY"
    echo ""
    echo "5. Depois de descobrir o IP, teste:"
    echo "   ./test-lan-print.sh <IP>"
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
        
        echo "🎯 Impressora encontrada: $IP:$PORT"
        echo ""
        read -p "Deseja testar a impressão agora? (s/N): " TEST_NOW
        
        if [[ "$TEST_NOW" =~ ^[Ss]$ ]]; then
            echo ""
            echo "🖨️  Testando impressão..."
            echo ""
            
            # Verificar se Print Bridge está rodando
            if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
                echo "Iniciando Print Bridge..."
                cd "$(dirname "$0")"
                node dist/index.js > /tmp/print-bridge-test.log 2>&1 &
                sleep 3
            fi
            
            # Testar impressão
            cd "$(dirname "$0")"
            ./test-lan-print.sh "$IP" "$PORT"
        else
            echo ""
            echo "💡 Para testar depois, execute:"
            echo "   ./test-lan-print.sh $IP $PORT"
            echo ""
            echo "💡 Para configurar permanentemente, adicione ao .env:"
            echo "   PRINTER_LAN_IP=$IP"
            echo "   PRINTER_LAN_PORT=$PORT"
        fi
    fi
fi

echo ""
echo "========================================"
echo "CONCLUÍDO"
echo "========================================"

