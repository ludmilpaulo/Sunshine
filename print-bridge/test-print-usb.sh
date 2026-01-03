#!/bin/bash

# Test print via USB
# Usage: ./test-print-usb.sh [printer-name]

PRINTER_NAME=${1:-${PRINTER_USB_NAME:-_USB_Receipt_Printer}}
PRINT_BRIDGE_URL=${PRINT_BRIDGE_URL:-http://localhost:3333}

echo "========================================"
echo "TEST PRINT: USB Printer"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Printer Name: $PRINTER_NAME"
echo "  Print Bridge URL: $PRINT_BRIDGE_URL"
echo ""

# Check if Print Bridge is running
if ! curl -s "$PRINT_BRIDGE_URL/health" > /dev/null 2>&1; then
  echo "❌ Print Bridge is not running"
  exit 1
fi

echo "✅ Print Bridge is running"
echo ""
echo "🖨️  Sending test print via USB..."
echo ""

# Create test payload
TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "USB",
  "usb": {
    "printerName": "$PRINTER_NAME"
  },
  "receipt": {
    "shopName": "Test Connection",
    "saleNumber": "TEST-USB-001",
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
    "footer": "USB Connection Test"
  },
  "cut": true,
  "openCashDrawer": false
}
EOF
)

# Send print request
RESPONSE=$(curl -s -X POST "$PRINT_BRIDGE_URL/print" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

# Check response
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ Print sent successfully!"
  echo ""
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo "Check your printer - it should have printed:"
  echo '   "the printer is connected to the LAN"'
else
  echo "❌ Print failed"
  echo ""
  echo "Response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo "Available printers:"
  curl -s "$PRINT_BRIDGE_URL/printers" | python3 -m json.tool 2>/dev/null | grep -A 2 '"name"'
fi

