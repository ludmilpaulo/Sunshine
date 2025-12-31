#!/bin/bash

# Script simplificado para configurar impressora Go Infinity no Mac
# Verifica USB e LAN, permite configuração manual

echo "🖨️  Configuração da Impressora Go Infinity"
echo "==========================================="
echo ""

# Verificar se Print Bridge está rodando
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "📡 Iniciando Print Bridge..."
    cd print-bridge
    PORT=3333 npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
    sleep 5
    
    if curl -s http://localhost:3333/health > /dev/null 2>&1; then
        echo "✅ Print Bridge iniciado"
    else
        echo "❌ Erro ao iniciar Print Bridge. Verifique os logs: /tmp/print-bridge.log"
        exit 1
    fi
    cd ..
else
    echo "✅ Print Bridge já está rodando"
fi

echo ""
echo "🔍 Verificando impressoras disponíveis..."
echo ""

# Listar impressoras via Print Bridge
PRINTERS=$(curl -s http://localhost:3333/printers)
echo "$PRINTERS" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS"

echo ""
echo "📋 Opções de Configuração:"
echo ""
echo "1. USB (se a impressora estiver conectada via USB)"
echo "2. LAN com IP conhecido"
echo "3. LAN com hostname"
echo "4. Auto-descoberta"
echo ""
read -p "Escolha uma opção (1-4): " OPTION

case $OPTION in
    1)
        echo ""
        echo "📡 Modo USB selecionado"
        echo ""
        echo "Certifique-se de que a impressora está conectada via USB"
        echo "e que o driver está instalado."
        echo ""
        read -p "Nome da impressora (ou pressione Enter para usar padrão): " PRINTER_NAME
        
        if [ -z "$PRINTER_NAME" ]; then
            PRINTER_NAME="GOINFINITY Thermal Receipt Printer"
        fi
        
        echo ""
        echo "🚀 Iniciando Print Bridge em modo USB..."
        pkill -f "tsx src/index.ts" 2>/dev/null || true
        sleep 2
        
        cd print-bridge
        PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME="$PRINTER_NAME" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
        sleep 5
        
        if curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo "✅ Print Bridge configurado para USB"
            echo "   Impressora: $PRINTER_NAME"
        else
            echo "❌ Erro ao iniciar Print Bridge"
            exit 1
        fi
        ;;
        
    2)
        echo ""
        echo "📡 Modo LAN com IP selecionado"
        echo ""
        read -p "Digite o IP da impressora (ex: 192.168.100.50): " PRINTER_IP
        read -p "Digite a porta (padrão: 9100): " PRINTER_PORT
        
        if [ -z "$PRINTER_PORT" ]; then
            PRINTER_PORT=9100
        fi
        
        echo ""
        echo "🔍 Testando conexão com $PRINTER_IP:$PRINTER_PORT..."
        
        if timeout 2 bash -c "echo > /dev/tcp/$PRINTER_IP/$PRINTER_PORT" 2>/dev/null; then
            echo "✅ Porta $PRINTER_PORT acessível!"
        else
            echo "⚠️  Porta $PRINTER_PORT não acessível, mas continuando..."
        fi
        
        echo ""
        echo "🚀 Iniciando Print Bridge em modo LAN..."
        pkill -f "tsx src/index.ts" 2>/dev/null || true
        sleep 2
        
        cd print-bridge
        PORT=3333 PRINTER_MODE=LAN PRINTER_LAN_IP="$PRINTER_IP" PRINTER_LAN_PORT="$PRINTER_PORT" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
        sleep 5
        
        if curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo "✅ Print Bridge configurado para LAN"
            echo "   IP: $PRINTER_IP:$PRINTER_PORT"
        else
            echo "❌ Erro ao iniciar Print Bridge"
            exit 1
        fi
        ;;
        
    3)
        echo ""
        echo "📡 Modo LAN com hostname selecionado"
        echo ""
        read -p "Digite o hostname da impressora (ex: goinfinity-printer.local): " PRINTER_HOSTNAME
        read -p "Digite a porta (padrão: 9100): " PRINTER_PORT
        
        if [ -z "$PRINTER_PORT" ]; then
            PRINTER_PORT=9100
        fi
        
        echo ""
        echo "🚀 Iniciando Print Bridge em modo LAN (hostname)..."
        pkill -f "tsx src/index.ts" 2>/dev/null || true
        sleep 2
        
        cd print-bridge
        PORT=3333 PRINTER_MODE=LAN PRINTER_HOSTNAME="$PRINTER_HOSTNAME" PRINTER_LAN_PORT="$PRINTER_PORT" npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
        sleep 5
        
        if curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo "✅ Print Bridge configurado para LAN (hostname)"
            echo "   Hostname: $PRINTER_HOSTNAME:$PRINTER_PORT"
        else
            echo "❌ Erro ao iniciar Print Bridge"
            exit 1
        fi
        ;;
        
    4)
        echo ""
        echo "📡 Modo AUTO (tenta LAN primeiro, depois USB)"
        echo ""
        echo "🚀 Iniciando Print Bridge em modo AUTO..."
        pkill -f "tsx src/index.ts" 2>/dev/null || true
        sleep 2
        
        cd print-bridge
        PORT=3333 PRINTER_MODE=AUTO npx tsx src/index.ts > /tmp/print-bridge.log 2>&1 &
        sleep 5
        
        if curl -s http://localhost:3333/health > /dev/null 2>&1; then
            echo "✅ Print Bridge configurado para AUTO"
        else
            echo "❌ Erro ao iniciar Print Bridge"
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "🧪 Testando impressão..."
echo ""

TEST_RECEIPT='{
  "mode": "AUTO",
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
    echo "💡 Dicas:"
    echo "   - Verifique se a impressora está ligada"
    echo "   - Verifique a conexão (USB ou LAN)"
    echo "   - Verifique os logs: tail -f /tmp/print-bridge.log"
fi

echo ""
echo "📝 Para usar no futuro:"
echo "   cd print-bridge"
if [ "$OPTION" = "1" ]; then
    echo "   PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME=\"$PRINTER_NAME\" npx tsx src/index.ts"
elif [ "$OPTION" = "2" ]; then
    echo "   PORT=3333 PRINTER_MODE=LAN PRINTER_LAN_IP=\"$PRINTER_IP\" PRINTER_LAN_PORT=$PRINTER_PORT npx tsx src/index.ts"
elif [ "$OPTION" = "3" ]; then
    echo "   PORT=3333 PRINTER_MODE=LAN PRINTER_HOSTNAME=\"$PRINTER_HOSTNAME\" PRINTER_LAN_PORT=$PRINTER_PORT npx tsx src/index.ts"
else
    echo "   PORT=3333 PRINTER_MODE=AUTO npx tsx src/index.ts"
fi
echo ""

