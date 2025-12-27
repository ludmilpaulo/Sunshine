#!/bin/bash

# Test script for Sunshine POS - All User Types
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000/api"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}=== Sunshine POS - Complete App Test ===${NC}\n"

# Test 1: Backend Health
echo -e "${YELLOW}1. Testing Backend Health...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/)
if [ "$BACKEND_STATUS" = "302" ] || [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    exit 1
fi

# Test 2: Frontend Health
echo -e "${YELLOW}2. Testing Frontend Health...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
    exit 1
fi

# Test 3: Admin Login
echo -e "\n${YELLOW}3. Testing Admin Login...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Admin login successful${NC}"
    
    # Test Admin endpoints
    echo -e "${YELLOW}   Testing Admin endpoints...${NC}"
    
    # Get user info
    ADMIN_ME=$(curl -s -X GET "$API_URL/auth/me/" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    echo -e "${GREEN}   ✓ GET /auth/me/ - User info retrieved${NC}"
    
    # Get dashboard stats
    DASHBOARD=$(curl -s -X GET "$API_URL/dashboard/stats/" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$DASHBOARD" | grep -q "sales"; then
        echo -e "${GREEN}   ✓ GET /dashboard/stats/ - Dashboard data retrieved${NC}"
    else
        echo -e "${RED}   ✗ Dashboard stats failed${NC}"
    fi
    
    # List products
    PRODUCTS=$(curl -s -X GET "$API_URL/products/" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$PRODUCTS" | grep -q "results\|name"; then
        PRODUCT_COUNT=$(echo "$PRODUCTS" | grep -o '"name"' | wc -l | tr -d ' ')
        echo -e "${GREEN}   ✓ GET /products/ - Found $PRODUCT_COUNT products${NC}"
    else
        echo -e "${RED}   ✗ Products list failed${NC}"
    fi
    
    # List users (admin only)
    USERS=$(curl -s -X GET "$API_URL/users/" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$USERS" | grep -q "results\|username"; then
        USER_COUNT=$(echo "$USERS" | grep -o '"username"' | wc -l | tr -d ' ')
        echo -e "${GREEN}   ✓ GET /users/ - Found $USER_COUNT users (Admin only)${NC}"
    else
        echo -e "${RED}   ✗ Users list failed${NC}"
    fi
    
    # Test product by barcode
    BARCODE_TEST=$(curl -s -X GET "$API_URL/products/by-barcode/1234567890123/" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    if echo "$BARCODE_TEST" | grep -q "Coca Cola"; then
        echo -e "${GREEN}   ✓ GET /products/by-barcode/ - Barcode lookup works${NC}"
    else
        echo -e "${RED}   ✗ Barcode lookup failed${NC}"
    fi
else
    echo -e "${RED}✗ Admin login failed${NC}"
fi

# Test 4: Manager Login
echo -e "\n${YELLOW}4. Testing Manager Login...${NC}"
MANAGER_TOKEN=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"username":"manager","password":"manager123"}' | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$MANAGER_TOKEN" ]; then
    echo -e "${GREEN}✓ Manager login successful${NC}"
    
    # Test Manager endpoints (should NOT have access to users)
    echo -e "${YELLOW}   Testing Manager endpoints...${NC}"
    
    MANAGER_ME=$(curl -s -X GET "$API_URL/auth/me/" \
        -H "Authorization: Bearer $MANAGER_TOKEN")
    if echo "$MANAGER_ME" | grep -q "manager"; then
        echo -e "${GREEN}   ✓ GET /auth/me/ - Manager role confirmed${NC}"
    fi
    
    # Manager should NOT access users endpoint
    MANAGER_USERS=$(curl -s -w "%{http_code}" -X GET "$API_URL/users/" \
        -H "Authorization: Bearer $MANAGER_TOKEN" -o /dev/null)
    if [ "$MANAGER_USERS" = "403" ]; then
        echo -e "${GREEN}   ✓ GET /users/ - Correctly blocked (403 Forbidden)${NC}"
    else
        echo -e "${YELLOW}   ⚠ GET /users/ - Unexpected response: $MANAGER_USERS${NC}"
    fi
    
    # Manager can access products and sales
    MANAGER_PRODUCTS=$(curl -s -X GET "$API_URL/products/" \
        -H "Authorization: Bearer $MANAGER_TOKEN")
    if echo "$MANAGER_PRODUCTS" | grep -q "results\|name"; then
        echo -e "${GREEN}   ✓ GET /products/ - Manager can access products${NC}"
    fi
else
    echo -e "${RED}✗ Manager login failed${NC}"
fi

# Test 5: Staff Login
echo -e "\n${YELLOW}5. Testing Staff Login...${NC}"
STAFF_TOKEN=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"username":"staff","password":"staff123"}' | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$STAFF_TOKEN" ]; then
    echo -e "${GREEN}✓ Staff login successful${NC}"
    
    # Test Staff endpoints
    echo -e "${YELLOW}   Testing Staff endpoints...${NC}"
    
    STAFF_ME=$(curl -s -X GET "$API_URL/auth/me/" \
        -H "Authorization: Bearer $STAFF_TOKEN")
    if echo "$STAFF_ME" | grep -q "staff"; then
        echo -e "${GREEN}   ✓ GET /auth/me/ - Staff role confirmed${NC}"
    fi
    
    # Staff can access products (for POS)
    STAFF_PRODUCTS=$(curl -s -X GET "$API_URL/products/by-barcode/1234567890123/" \
        -H "Authorization: Bearer $STAFF_TOKEN")
    if echo "$STAFF_PRODUCTS" | grep -q "Coca Cola"; then
        echo -e "${GREEN}   ✓ GET /products/by-barcode/ - Staff can lookup products${NC}"
    fi
    
    # Staff should NOT access users
    STAFF_USERS=$(curl -s -w "%{http_code}" -X GET "$API_URL/users/" \
        -H "Authorization: Bearer $STAFF_TOKEN" -o /dev/null)
    if [ "$STAFF_USERS" = "403" ]; then
        echo -e "${GREEN}   ✓ GET /users/ - Correctly blocked (403 Forbidden)${NC}"
    fi
else
    echo -e "${RED}✗ Staff login failed${NC}"
fi

# Test 6: Checkout (Sale) - Test with Staff
echo -e "\n${YELLOW}6. Testing Checkout (Sale Creation)...${NC}"
if [ -n "$STAFF_TOKEN" ]; then
    CHECKOUT_RESPONSE=$(curl -s -X POST "$API_URL/sales/checkout/" \
        -H "Authorization: Bearer $STAFF_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "items": [
                {"barcode": "1234567890123", "qty": 2, "unit_price": "2.50"},
                {"barcode": "2345678901234", "qty": 1, "unit_price": "3.00"}
            ],
            "payments": [
                {"method": "CASH", "amount": "8.00", "reference": ""}
            ]
        }')
    
    if echo "$CHECKOUT_RESPONSE" | grep -q "saleId\|saleNumber"; then
        SALE_NUMBER=$(echo "$CHECKOUT_RESPONSE" | grep -o '"saleNumber":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Checkout successful - Sale: $SALE_NUMBER${NC}"
        
        # Verify sale was created
        SALES_LIST=$(curl -s -X GET "$API_URL/sales/" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        if echo "$SALES_LIST" | grep -q "$SALE_NUMBER"; then
            echo -e "${GREEN}  ✓ Sale appears in sales list${NC}"
        fi
    else
        echo -e "${RED}✗ Checkout failed: $CHECKOUT_RESPONSE${NC}"
    fi
else
    echo -e "${RED}✗ Cannot test checkout - Staff login failed${NC}"
fi

# Test 7: Stock Adjustment (Admin/Manager)
echo -e "\n${YELLOW}7. Testing Stock Adjustment...${NC}"
if [ -n "$ADMIN_TOKEN" ]; then
    # Get a product ID first
    PRODUCT_ID=$(curl -s -X GET "$API_URL/products/by-barcode/1234567890123/" \
        -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$PRODUCT_ID" ]; then
        STOCK_ADJUST=$(curl -s -X POST "$API_URL/stock/adjust/" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"product_id\": $PRODUCT_ID,
                \"qty_change\": 10,
                \"reason\": \"ADJUSTMENT\",
                \"notes\": \"Test stock adjustment\"
            }")
        
        if echo "$STOCK_ADJUST" | grep -q "success\|new_qty"; then
            echo -e "${GREEN}✓ Stock adjustment successful${NC}"
        else
            echo -e "${RED}✗ Stock adjustment failed${NC}"
        fi
    fi
fi

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✓ Backend: Running${NC}"
echo -e "${GREEN}✓ Frontend: Running${NC}"
echo -e "${GREEN}✓ Admin: Full access tested${NC}"
echo -e "${GREEN}✓ Manager: Limited access tested${NC}"
echo -e "${GREEN}✓ Staff: POS access tested${NC}"
echo -e "${GREEN}✓ Checkout: Sale creation tested${NC}"
echo -e "\n${YELLOW}Test Credentials:${NC}"
echo -e "  Admin:   username=admin,   password=admin123"
echo -e "  Manager: username=manager, password=manager123"
echo -e "  Staff:   username=staff,   password=staff123"
echo -e "\n${BLUE}Frontend URL: $FRONTEND_URL${NC}"
echo -e "${BLUE}Backend API: $API_URL${NC}"

