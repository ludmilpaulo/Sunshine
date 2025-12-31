#!/bin/bash

echo "🧪 Teste Completo - Scanner e Impressora"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Frontend
echo "1️⃣ Verificando Frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Frontend rodando em http://localhost:3000${NC}"
else
    echo -e "   ${RED}❌ Frontend não está rodando${NC}"
    echo "   Execute: cd frontend && npm run dev"
fi
echo ""

# Test 2: Backend
echo "2️⃣ Verificando Backend..."
if curl -s http://localhost:8000/api/ > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backend rodando em http://localhost:8000${NC}"
else
    echo -e "   ${RED}❌ Backend não está rodando${NC}"
    echo "   Execute: cd backend && python manage.py runserver 8000"
fi
echo ""

# Test 3: Print Bridge
echo "3️⃣ Verificando Print Bridge..."
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Print Bridge rodando em http://localhost:3333${NC}"
    
    # Test printers endpoint
    PRINTERS=$(curl -s http://localhost:3333/printers 2>&1)
    if echo "$PRINTERS" | grep -q "printers"; then
        echo "   Impressoras configuradas:"
        echo "$PRINTERS" | python3 -m json.tool 2>/dev/null | grep -E "name|ip|hostname" | head -10 || echo "$PRINTERS" | head -5
    fi
    
    # Test discovery
    echo "   Testando auto-descoberta..."
    DISCOVER=$(curl -s http://localhost:3333/discover 2>&1)
    if echo "$DISCOVER" | grep -q "success.*true"; then
        echo -e "   ${GREEN}✅ Impressora encontrada via auto-descoberta${NC}"
        echo "$DISCOVER" | python3 -m json.tool 2>/dev/null | grep -E "ip|port|hostname" || echo "$DISCOVER"
    else
        echo -e "   ${YELLOW}⚠️  Nenhuma impressora encontrada automaticamente${NC}"
    fi
else
    echo -e "   ${RED}❌ Print Bridge não está rodando${NC}"
    echo "   Execute: cd print-bridge && ./start-lan.sh"
fi
echo ""

# Test 4: Scanner Test Instructions
echo "4️⃣ Teste do Scanner:"
echo ""
echo "   📍 Acesse: http://localhost:3000/test-scanner"
echo "   📷 Escaneie um código de barras"
echo "   🔍 Verifique o console do navegador (F12) para logs"
echo ""
echo "   Ou teste manualmente:"
echo "   1. Abra http://localhost:3000/test-scanner"
echo "   2. Digite rapidamente um código (ex: 7898553445613)"
echo "   3. Pressione Enter imediatamente"
echo "   4. O código deve aparecer na lista"
echo ""

# Test 5: Print Test
echo "5️⃣ Teste de Impressão:"
echo ""

if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "   Enviando recibo de teste..."
    
    TEST_RECEIPT=$(cat <<EOF
{
  "mode": "AUTO",
  "receipt": {
    "shopName": "Sunshine POS - Teste",
    "shopPhone": "+244 923 456 789",
    "shopAddress": "Luanda, Angola",
    "saleNumber": "TEST-$(date +%s)",
    "date": "$(date +"%d/%m/%Y %H:%M")",
    "subtotal": "1,000.00",
    "tax": "140.00",
    "total": "1,140.00",
    "items": [
      {
        "name": "Teste de Impressão",
        "qty": 1,
        "unitPrice": "1,000.00",
        "total": "1,000.00"
      }
    ],
    "footer": "Teste de Scanner e Impressora"
  },
  "cut": true,
  "openCashDrawer": false
}
EOF
)
    
    PRINT_RESULT=$(curl -s -X POST http://localhost:3333/print \
      -H "Content-Type: application/json" \
      -d "$TEST_RECEIPT" 2>&1)
    
    if echo "$PRINT_RESULT" | grep -q '"ok".*true'; then
        echo -e "   ${GREEN}✅ Impressão enviada com sucesso!${NC}"
        echo "   Resposta: $PRINT_RESULT"
        echo ""
        echo "   Verifique se o recibo foi impresso na impressora"
    else
        echo -e "   ${RED}❌ Falha na impressão${NC}"
        echo "   Erro: $PRINT_RESULT"
        echo ""
        echo "   Possíveis causas:"
        echo "   - Impressora não configurada"
        echo "   - IP/hostname incorreto"
        echo "   - Impressora desligada ou desconectada"
    fi
else
    echo -e "   ${RED}❌ Print Bridge não está rodando${NC}"
fi
echo ""

# Summary
echo "📊 Resumo:"
echo "=========="
echo ""
echo "✅ Serviços necessários:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8000"
echo "   - Print Bridge: http://localhost:3333"
echo ""
echo "🧪 Testes:"
echo "   - Scanner: http://localhost:3000/test-scanner"
echo "   - POS: http://localhost:3000/pos"
echo "   - Impressão: Acima"
echo ""
echo "💡 Dicas:"
echo "   - Scanner: Digite rápido (<50ms entre caracteres) para simular scanner"
echo "   - Impressora: Configure hostname para funcionar mesmo com IP dinâmico"
echo "   - Logs: Abra console do navegador (F12) para ver detalhes"

