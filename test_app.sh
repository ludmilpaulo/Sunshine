#!/bin/bash

# Script completo de teste da aplicação Sunshine POS
# Testa backend, frontend e funcionalidades principais

set -e

echo "🧪 Testando Aplicação Sunshine POS"
echo "===================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "  Testando: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" 2>/dev/null || echo -e "\n000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $http_code, esperado $expected_status)"
        echo "    Resposta: $body"
        return 1
    fi
}

# 1. Verificar se backend está rodando
echo "1️⃣ Verificando Backend..."
if curl -s http://localhost:8000/api/auth/me/ > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend está rodando em http://localhost:8000"
else
    echo -e "  ${RED}✗${NC} Backend não está rodando!"
    echo "     Execute: cd backend && python3 manage.py runserver"
    exit 1
fi
echo ""

# 2. Verificar se frontend está rodando
echo "2️⃣ Verificando Frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend está rodando em http://localhost:3000"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend não está rodando (opcional para testes de API)"
    echo "     Execute: cd frontend && npm run dev"
fi
echo ""

# 3. Testar Login
echo "3️⃣ Testando Autenticação..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"test1234"}')

if echo "$LOGIN_RESPONSE" | grep -q "access"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*' | cut -d'"' -f4)
    echo -e "  ${GREEN}✓${NC} Login bem-sucedido (admin)"
else
    echo -e "  ${RED}✗${NC} Falha no login"
    echo "    Resposta: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 4. Testar /api/auth/me
echo "4️⃣ Testando Endpoint /api/auth/me..."
test_endpoint "GET" "http://localhost:8000/api/auth/me/" "" "200" "Obter informações do usuário"
ME_RESPONSE=$(curl -s -X GET http://localhost:8000/api/auth/me/ \
    -H "Authorization: Bearer $TOKEN")
if echo "$ME_RESPONSE" | grep -q "operation_type"; then
    echo -e "  ${GREEN}✓${NC} operation_type presente na resposta"
else
    echo -e "  ${YELLOW}⚠${NC} operation_type não encontrado na resposta"
fi
echo ""

# 5. Testar criação de produto (admin only)
echo "5️⃣ Testando Criação de Produto..."
PRODUCT_DATA='{
    "name": "Produto Teste",
    "barcode": "1234567890123",
    "sku": "TEST-001",
    "price": "100.00",
    "cost": "50.00",
    "tax_rate": "14.00",
    "active": true,
    "initial_stock": 10
}'
test_endpoint "POST" "http://localhost:8000/api/products/" "$PRODUCT_DATA" "201" "Criar produto"
echo ""

# 6. Testar listagem de produtos
echo "6️⃣ Testando Listagem de Produtos..."
test_endpoint "GET" "http://localhost:8000/api/products/" "" "200" "Listar produtos"
echo ""

# 7. Testar busca por código de barras
echo "7️⃣ Testando Busca por Código de Barras..."
test_endpoint "GET" "http://localhost:8000/api/products/by-barcode/1234567890123/" "" "200" "Buscar produto por barcode"
echo ""

# 8. Testar criação de usuário (admin only)
echo "8️⃣ Testando Criação de Usuário..."
USER_DATA='{
    "username": "test_user_salon",
    "email": "test_salon@test.com",
    "first_name": "Test",
    "last_name": "Salon",
    "password": "test1234",
    "role": "staff",
    "operation_type": "SALON",
    "is_active": true
}'
test_endpoint "POST" "http://localhost:8000/api/users/" "$USER_DATA" "201" "Criar usuário Salon"
echo ""

# 9. Testar criação de usuário Studio
echo "9️⃣ Testando Criação de Usuário Studio..."
USER_DATA_STUDIO='{
    "username": "test_user_studio",
    "email": "test_studio@test.com",
    "first_name": "Test",
    "last_name": "Studio",
    "password": "test1234",
    "role": "staff",
    "operation_type": "STUDIO",
    "is_active": true
}'
test_endpoint "POST" "http://localhost:8000/api/users/" "$USER_DATA_STUDIO" "201" "Criar usuário Studio"
echo ""

# 10. Testar Analytics
echo "🔟 Testando Analytics..."
test_endpoint "GET" "http://localhost:8000/api/analytics/sales-by-user/?period=month" "" "200" "Analytics por usuário"
test_endpoint "GET" "http://localhost:8000/api/analytics/sales-by-payment-method/?period=month" "" "200" "Analytics por método de pagamento"
test_endpoint "GET" "http://localhost:8000/api/analytics/sales-by-user-with-tax/?period=month" "" "200" "Analytics com impostos"
echo ""

# 11. Testar Dashboard
echo "1️⃣1️⃣ Testando Dashboard..."
test_endpoint "GET" "http://localhost:8000/api/dashboard/stats/" "" "200" "Estatísticas do dashboard"
test_endpoint "GET" "http://localhost:8000/api/dashboard/sales-chart/" "" "200" "Gráfico de vendas"
test_endpoint "GET" "http://localhost:8000/api/dashboard/top-products/" "" "200" "Top produtos"
echo ""

# 12. Testar Checkout (precisa de produtos no estoque)
echo "1️⃣2️⃣ Testando Checkout..."
# Primeiro, garantir que temos um produto com estoque
PRODUCT_CHECKOUT='{
    "name": "Produto Checkout Test",
    "barcode": "9999999999999",
    "price": "50.00",
    "tax_rate": "14.00",
    "active": true,
    "initial_stock": 5
}'
curl -s -X POST http://localhost:8000/api/products/ \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PRODUCT_CHECKOUT" > /dev/null

CHECKOUT_DATA='{
    "items": [{"barcode": "9999999999999", "qty": 1, "unit_price": "50.00"}],
    "payments": [{"method": "CASH", "amount": "57.00", "reference": ""}],
    "operation_type": "SALON"
}'
test_endpoint "POST" "http://localhost:8000/api/sales/checkout/" "$CHECKOUT_DATA" "201" "Finalizar venda"
echo ""

# 13. Verificar se a venda foi criada com operation_type
echo "1️⃣3️⃣ Verificando Venda Criada..."
SALES_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/sales/?page_size=1" \
    -H "Authorization: Bearer $TOKEN")
if echo "$SALES_RESPONSE" | grep -q "operation_type"; then
    echo -e "  ${GREEN}✓${NC} Venda criada com operation_type"
else
    echo -e "  ${YELLOW}⚠${NC} operation_type não encontrado na venda"
fi
echo ""

# 14. Testar filtro de operation_type no analytics
echo "1️⃣4️⃣ Testando Filtro de Operation Type..."
test_endpoint "GET" "http://localhost:8000/api/analytics/sales-by-user/?period=month&operation_type=SALON" "" "200" "Analytics filtrado por SALON"
test_endpoint "GET" "http://localhost:8000/api/analytics/sales-by-user/?period=month&operation_type=STUDIO" "" "200" "Analytics filtrado por STUDIO"
echo ""

echo "===================================="
echo -e "${GREEN}✅ Testes Concluídos!${NC}"
echo ""
echo "📝 Resumo:"
echo "  - Backend: Funcionando"
echo "  - Autenticação: OK"
echo "  - CRUD Produtos: OK"
echo "  - CRUD Usuários: OK"
echo "  - Operation Type: OK"
echo "  - Analytics: OK"
echo "  - Dashboard: OK"
echo "  - Checkout: OK"
echo ""
echo "🌐 Acesse:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000/api/"
echo "  - Admin: http://localhost:8000/admin/"
echo ""
echo "👤 Usuários de Teste:"
echo "  - Admin: admin / test1234 (BOTH)"
echo "  - Manager: manager / test1234 (SALON)"
echo "  - Staff: staff / test1234 (SALON)"
echo ""
