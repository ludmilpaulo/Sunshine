#!/bin/bash

# Simple test print script using curl
# Usage: ./test-print-simple.sh [printer-ip] [port]

PRINTER_IP=${1:-${PRINTER_LAN_IP}}
PRINTER_PORT=${2:-${PRINTER_LAN_PORT:-9100}}
PRINT_BRIDGE_URL=${PRINT_BRIDGE_URL:-http://localhost:3333}

if [ -z "$PRINTER_IP" ]; then
  echo "❌ Error: Printer IP not provided"
  echo ""
  echo "Usage:"
  echo "  ./test-print-simple.sh <printer-ip> [port]"
  echo ""
  echo "Example:"
  echo "  ./test-print-simple.sh 192.168.1.50"
  exit 1
fi

echo "========================================"
echo "TEST PRINT: Printer LAN Connection"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Printer IP: $PRINTER_IP"
echo "  Printer Port: $PRINTER_PORT"
echo "  Print Bridge URL: $PRINT_BRIDGE_URL"
echo ""

# Check if Print Bridge is running
if ! curl -s "$PRINT_BRIDGE_URL/health" > /dev/null 2>&1; then
  echo "❌ Print Bridge is not running"
  echo "   Make sure Print Bridge is running at $PRINT_BRIDGE_URL"
  echo "   Start it with: npm run dev"
  exit 1
fi

echo "✅ Print Bridge is running"
echo ""
echo "🖨️  Sending test print..."
echo ""

# Create test payload
TEST_PAYLOAD=$(cat <<EOF
{
  "mode": "LAN",
  "lan": {
    "ip": "$PRINTER_IP",
    "port": $PRINTER_PORT
  },
  "receipt": {
    "shopName": "Test Connection",
    "saleNumber": "TEST-LAN-001",
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
    "footer": "LAN Connection Test"
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
  echo "Troubleshooting:"
  echo "  - Verify printer IP is correct: $PRINTER_IP"
  echo "  - Check printer is powered on and connected to network"
  echo "  - Test connection: ping $PRINTER_IP"
  echo "  - Test port: nc -zv $PRINTER_IP $PRINTER_PORT"
  exit 1
fi

