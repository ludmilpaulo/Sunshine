#!/bin/bash

# Script para descobrir e configurar a impressora Go Infinity no Mac
# Uso: ./setup_printer_mac.sh

set -e

echo "🖨️  Configurando Impressora Go Infinity no Mac"
echo "================================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para testar porta 9100
test_printer_port() {
    local ip=$1
    timeout 2 bash -c "echo > /dev/tcp/$ip/9100" 2>/dev/null
    return $?
}

# Função para descobrir IPs na rede
discover_network() {
    echo "1️⃣ Descobrindo rede local..."
    
    # Pegar IP da máquina
    CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    
    if [ -z "$CURRENT_IP" ]; then
        echo -e "${RED}❌ Não foi possível detectar o IP da máquina${NC}"
        return 1
    fi
    
    NETWORK=$(echo $CURRENT_IP | cut -d. -f1-3)
    echo -e "${GREEN}✅ Rede detectada: ${NETWORK}.0/24${NC}"
    echo ""
    
    return 0
}

# Função para escanear IPs na rede
scan_for_printer() {
    local network=$1
    echo "2️⃣ Escaneando rede ${network}.0/24 em busca da impressora..."
    echo "   (Isso pode levar alguns minutos...)"
    echo ""
    
    FOUND_IPS=()
    
    # Testar IPs comuns primeiro (mais rápido)
    COMMON_IPS=(100 101 102 103 104 105 50 51 52 53 54 55 200 201 202 203 204 205)
    
    echo "   Testando IPs comuns..."
    for i in "${COMMON_IPS[@]}"; do
        IP="${network}.${i}"
        echo -n "   Testando ${IP}... "
        
        # Testar se o host está ativo
        if ping -c 1 -W 1 "$IP" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Ativo${NC}"
            
            # Testar porta 9100 (porta padrão de impressoras térmicas)
            if test_printer_port "$IP"; then
                echo -e "      ${GREEN}🖨️  Porta 9100 aberta - Pode ser a impressora!${NC}"
                FOUND_IPS+=("$IP")
            fi
        else
            echo "Inativo"
        fi
    done
    
    # Se não encontrou, escanear toda a rede (mais lento)
    if [ ${#FOUND_IPS[@]} -eq 0 ]; then
        echo ""
        echo "   Nenhuma impressora encontrada nos IPs comuns."
        echo "   Escaneando toda a rede (isso pode levar alguns minutos)..."
        echo ""
        
        for i in {1..254}; do
            IP="${network}.${i}"
            
            # Pular IP da própria máquina
            if [ "$IP" = "$CURRENT_IP" ]; then
                continue
            fi
            
            # Testar ping
            if ping -c 1 -W 1 "$IP" > /dev/null 2>&1; then
                # Testar porta 9100
                if test_printer_port "$IP"; then
                    echo -e "   ${GREEN}✅ Impressora encontrada: ${IP}:9100${NC}"
                    FOUND_IPS+=("$IP")
                fi
            fi
            
            # Mostrar progresso a cada 10 IPs
            if [ $((i % 10)) -eq 0 ]; then
                echo -n "   Progresso: $i/254... "
                if [ ${#FOUND_IPS[@]} -gt 0 ]; then
                    echo -e "${GREEN}${#FOUND_IPS[@]} impressora(s) encontrada(s)${NC}"
                else
                    echo "Nenhuma ainda"
                fi
            fi
        done
    fi
    
    return 0
}

# Função para verificar via ARP
check_arp_table() {
    echo "3️⃣ Verificando tabela ARP..."
    ARP_DEVICES=$(arp -a | grep -E "192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\." | awk '{print $2}' | tr -d '()' | sort -u)
    
    if [ -n "$ARP_DEVICES" ]; then
        echo "   Dispositivos encontrados na rede:"
        for ip in $ARP_DEVICES; do
            echo -n "   - $ip: "
            if test_printer_port "$ip"; then
                echo -e "${GREEN}Porta 9100 aberta - Pode ser a impressora!${NC}"
                FOUND_IPS+=("$ip")
            else
                echo "Porta 9100 fechada"
            fi
        done
    fi
    echo ""
}

# Função para testar IP específico
test_printer_ip() {
    local ip=$1
    echo "4️⃣ Testando conexão com ${ip}..."
    
    # Testar ping
    if ! ping -c 2 -W 2 "$ip" > /dev/null 2>&1; then
        echo -e "${RED}❌ Não foi possível fazer ping em ${ip}${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Ping OK${NC}"
    
    # Testar porta 9100
    if test_printer_port "$ip"; then
        echo -e "${GREEN}✅ Porta 9100 aberta - Impressora encontrada!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Porta 9100 fechada ou não é uma impressora${NC}"
        return 1
    fi
}

# Função para configurar Print Bridge
configure_print_bridge() {
    local ip=$1
    
    echo ""
    echo "5️⃣ Configurando Print Bridge..."
    
    # Verificar se Print Bridge está rodando
    if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Print Bridge não está rodando. Iniciando...${NC}"
        
        cd print-bridge
        PORT=3333 PRINTER_LAN_IP="$ip" PRINTER_LAN_PORT=9100 npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
        PB_PID=$!
        
        echo "   Aguardando Print Bridge iniciar..."
        sleep 5
        
        if curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Print Bridge iniciado (PID: $PB_PID)${NC}"
        else
            echo -e "${RED}❌ Falha ao iniciar Print Bridge${NC}"
            echo "   Logs: /tmp/print-bridge.log"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Print Bridge já está rodando${NC}"
    fi
    
    # Testar impressão
    echo ""
    echo "6️⃣ Testando impressão..."
    
    TEST_RECEIPT='{
      "mode": "LAN",
      "lan": {
        "ip": "'"$ip"'",
        "port": 9100
      },
      "receipt": {
        "shopName": "Sunshine POS",
        "shopPhone": "244 9XX XXX XXX",
        "shopAddress": "Luanda, Angola",
        "saleNumber": "TEST-SETUP-'$(date +%s)'",
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
        echo -e "${GREEN}✅ Recibo de teste enviado com sucesso!${NC}"
        echo ""
        echo "📄 Verifique se a impressora Go Infinity imprimiu o recibo"
        echo ""
        echo "✅ Configuração concluída!"
        echo ""
        echo "📝 Para usar no futuro:"
        echo "   cd print-bridge"
        echo "   ./start-lan.sh $ip 9100"
        return 0
    else
        echo -e "${RED}❌ Erro ao imprimir:${NC}"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        return 1
    fi
}

# Main
main() {
    discover_network
    NETWORK=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1 | cut -d. -f1-3)
    
    FOUND_IPS=()
    
    scan_for_printer "$NETWORK"
    check_arp_table
    
    # Remover duplicatas
    FOUND_IPS=($(printf '%s\n' "${FOUND_IPS[@]}" | sort -u))
    
    if [ ${#FOUND_IPS[@]} -eq 0 ]; then
        echo -e "${RED}❌ Nenhuma impressora encontrada na rede${NC}"
        echo ""
        echo "💡 Tente:"
        echo "   1. Verificar se a impressora está ligada e conectada à rede"
        echo "   2. Verificar o menu da impressora para o IP"
        echo "   3. Verificar o roteador para dispositivos conectados"
        echo ""
        echo "   Ou configure manualmente:"
        echo "   cd print-bridge"
        echo "   ./start-lan.sh [IP_DA_IMPRESSORA] 9100"
        exit 1
    fi
    
    if [ ${#FOUND_IPS[@]} -eq 1 ]; then
        PRINTER_IP="${FOUND_IPS[0]}"
        echo -e "${GREEN}✅ Impressora encontrada: ${PRINTER_IP}${NC}"
        echo ""
        
        if test_printer_ip "$PRINTER_IP"; then
            configure_print_bridge "$PRINTER_IP"
        else
            echo -e "${YELLOW}⚠️  IP encontrado mas porta 9100 não está acessível${NC}"
            echo "   Verifique se a impressora está configurada corretamente"
        fi
    else
        echo -e "${YELLOW}⚠️  Múltiplas impressoras encontradas:${NC}"
        for i in "${!FOUND_IPS[@]}"; do
            echo "   $((i+1)). ${FOUND_IPS[$i]}"
        done
        echo ""
        echo "Por favor, selecione qual é a Go Infinity:"
        read -p "Digite o número (1-${#FOUND_IPS[@]}): " SELECTION
        
        if [ "$SELECTION" -ge 1 ] && [ "$SELECTION" -le ${#FOUND_IPS[@]} ]; then
            PRINTER_IP="${FOUND_IPS[$((SELECTION-1))]}"
            if test_printer_ip "$PRINTER_IP"; then
                configure_print_bridge "$PRINTER_IP"
            fi
        else
            echo -e "${RED}❌ Seleção inválida${NC}"
            exit 1
        fi
    fi
}

# Executar
main

