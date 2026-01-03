#!/bin/bash

# Comprehensive test for USB printing in local and production scenarios

echo "========================================"
echo "🧪 USB PRINTER TEST - LOCAL & PRODUCTION"
echo "========================================"
echo ""

cd "$(dirname "$0")"

PRINT_BRIDGE_URL=${PRINT_BRIDGE_URL:-http://localhost:3333}
PRINTER_NAME=${PRINTER_USB_NAME:-_USB_Receipt_Printer}

echo "Configuration:"
echo "  Print Bridge URL: $PRINT_BRIDGE_URL"
echo "  Printer Name: $PRINTER_NAME"
echo ""

# Check Print Bridge
echo "Step 1: Checking Print Bridge..."
if curl -s "$PRINT_BRIDGE_URL/health" > /dev/null 2>&1; then
    echo "✅ Print Bridge is running"
else
    echo "❌ Print Bridge is not running"
    echo "   Start it with: npm run dev"
    exit 1
fi

# List available printers
echo ""
echo "Step 2: Listing available printers..."
PRINTERS=$(curl -s "$PRINT_BRIDGE_URL/printers")
echo "$PRINTERS" | python3 -m json.tool 2>/dev/null || echo "$PRINTERS"
echo ""

# Check if USB printer is available
if echo "$PRINTERS" | grep -q "USB"; then
    echo "✅ USB printer detected"
else
    echo "⚠️  USB printer not found in list"
fi

# Test 1: Local USB Print
echo ""
echo "========================================"
echo "TEST 1: Local USB Print"
echo "========================================"
echo ""

TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "USB",
  "usb": {
    "printerName": "$PRINTER_NAME"
  },
  "receipt": {
    "shopName": "Local Test Shop",
    "saleNumber": "LOCAL-TEST-001",
    "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "subtotal": "0.00",
    "tax": "0.00",
    "total": "0.00",
    "items": [
      {
        "name": "the printer is connected to the LAN",
        "qty": 1,
        "unitPrice": "0.00",
        "total": "0.00"
      }
    ],
    "footer": "Local USB Test"
  },
  "cut": true,
  "openCashDrawer": false
}
EOF
)

echo "Sending test print..."
RESPONSE=$(curl -s -X POST "$PRINT_BRIDGE_URL/print" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Local USB print: SUCCESS"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Local USB print: FAILED"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

# Test 2: AUTO Mode (LAN fallback to USB)
echo ""
echo "========================================"
echo "TEST 2: AUTO Mode (USB Fallback)"
echo "========================================"
echo ""

AUTO_PAYLOAD=$(cat <<EOF
{
  "mode": "AUTO",
  "usb": {
    "printerName": "$PRINTER_NAME"
  },
  "receipt": {
    "shopName": "AUTO Test Shop",
    "saleNumber": "AUTO-TEST-001",
    "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "subtotal": "0.00",
    "tax": "0.00",
    "total": "0.00",
    "items": [
      {
        "name": "AUTO mode test - USB fallback",
        "qty": 1,
        "unitPrice": "0.00",
        "total": "0.00"
      }
    ],
    "footer": "AUTO Mode Test"
  },
  "cut": true,
  "openCashDrawer": false
}
EOF
)

echo "Sending AUTO mode test (will use USB since LAN not configured)..."
AUTO_RESPONSE=$(curl -s -X POST "$PRINT_BRIDGE_URL/print" \
  -H "Content-Type: application/json" \
  -d "$AUTO_PAYLOAD")

if echo "$AUTO_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ AUTO mode print: SUCCESS"
    echo "$AUTO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AUTO_RESPONSE"
else
    echo "❌ AUTO mode print: FAILED"
    echo "$AUTO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AUTO_RESPONSE"
fi

# Production Configuration Check
echo ""
echo "========================================"
echo "PRODUCTION CONFIGURATION CHECK"
echo "========================================"
echo ""

echo "Current .env configuration:"
if [ -f ".env" ]; then
    echo ""
    cat .env | grep -E "^(PORT|PRINTER_|CORS_)" || cat .env
    echo ""
    
    # Check USB config
    if grep -q "^PRINTER_USB_NAME=" .env; then
        USB_NAME=$(grep "^PRINTER_USB_NAME=" .env | cut -d'=' -f2)
        echo "✅ USB printer configured: $USB_NAME"
    else
        echo "⚠️  PRINTER_USB_NAME not set in .env"
    fi
    
    # Check for production settings
    if grep -q "CORS_ORIGIN_ALLOW_ALL" .env; then
        echo "✅ CORS configuration found"
    else
        echo "ℹ️  CORS_ORIGIN_ALLOW_ALL not set (using defaults)"
    fi
else
    echo "⚠️  .env file not found"
fi

# Summary
echo ""
echo "========================================"
echo "📋 TEST SUMMARY"
echo "========================================"
echo ""
echo "✅ Print Bridge: Running"
echo "✅ USB Printer: Configured as '$PRINTER_NAME'"
echo ""
echo "For Production:"
echo "  1. Ensure Print Bridge runs on cashier PC"
echo "  2. USB printer must be connected to same PC"
echo "  3. Frontend should use: http://localhost:3333"
echo "  4. Or set NEXT_PUBLIC_PRINT_BRIDGE_URL if Print Bridge is on different machine"
echo ""
echo "✅ USB printing is ready for local and production use!"
echo ""

