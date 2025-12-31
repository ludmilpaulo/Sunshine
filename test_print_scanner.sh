#!/bin/bash

echo "🧪 Testando Scanner e Impressora"
echo "=================================="
echo ""

# Test Print Bridge Health
echo "1️⃣ Testando Print Bridge Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3333/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Print Bridge está rodando"
    echo "   Resposta: $HEALTH_RESPONSE"
else
    echo "❌ Print Bridge não está respondendo"
    echo "   Resposta: $HEALTH_RESPONSE"
    echo "   Execute: cd print-bridge && ./start.sh"
fi
echo ""

# Test Printers List
echo "2️⃣ Listando impressoras disponíveis..."
PRINTERS_RESPONSE=$(curl -s http://localhost:3333/printers 2>&1)
if echo "$PRINTERS_RESPONSE" | grep -q "printers"; then
    echo "✅ Impressoras encontradas:"
    echo "$PRINTERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS_RESPONSE"
else
    echo "⚠️  Erro ao listar impressoras:"
    echo "$PRINTERS_RESPONSE"
fi
echo ""

# Test Print (with sample receipt)
echo "3️⃣ Testando impressão de recibo de teste..."
TEST_RECEIPT='{
  "mode": "AUTO",
  "receipt": {
    "shopName": "Sunshine POS",
    "shopPhone": "+244 923 456 789",
    "shopAddress": "Luanda, Angola",
    "saleNumber": "TEST-001",
    "date": "'$(date +"%d/%m/%Y %H:%M")'",
    "subtotal": "1,000.00",
    "tax": "140.00",
    "total": "1,140.00",
    "items": [
      {
        "name": "Produto Teste",
        "qty": 1,
        "unitPrice": "1,000.00",
        "total": "1,000.00"
      }
    ],
    "footer": "Obrigado pela sua compra!"
  },
  "cut": true,
  "openCashDrawer": false
}'

PRINT_RESPONSE=$(curl -s -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d "$TEST_RECEIPT" 2>&1)

if echo "$PRINT_RESPONSE" | grep -q "ok"; then
    echo "✅ Impressão enviada com sucesso!"
    echo "   Resposta: $PRINT_RESPONSE"
else
    echo "⚠️  Impressão pode ter falhado (verifique a impressora):"
    echo "$PRINT_RESPONSE"
fi
echo ""

# Scanner Test Instructions
echo "4️⃣ Teste do Scanner:"
echo "   📍 Acesse: http://localhost:3000/test-scanner"
echo "   📍 Ou use a página POS: http://localhost:3000/pos"
echo "   📷 Escaneie um código de barras"
echo "   🔍 Verifique o console do navegador (F12) para logs"
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "   - Se a impressora não imprimir, verifique se está conectada e configurada"
echo "   - Para scanner, certifique-se de que está em modo 'Keyboard Wedge'"
echo "   - Abra o console do navegador (F12) para ver logs detalhados do scanner"

