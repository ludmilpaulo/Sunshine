#!/bin/bash

# Configure printer when you know the IP address

echo "========================================"
echo "⚙️  CONFIGURE PRINTER WITH IP ADDRESS"
echo "========================================"
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./configure-with-ip.sh <printer-ip> [port]"
    echo ""
    echo "Example:"
    echo "  ./configure-with-ip.sh 192.168.1.50"
    echo "  ./configure-with-ip.sh 192.168.1.50 9100"
    echo ""
    echo "To find the IP address:"
    echo "  1. Check printer menu: Network Settings → IP Address"
    echo "  2. Print network config page from printer"
    echo "  3. Check router admin (192.168.1.1) → Ethernet Devices"
    exit 1
fi

PRINTER_IP=$1
PRINTER_PORT=${2:-9100}

echo "Configuring printer:"
echo "  IP Address: $PRINTER_IP"
echo "  Port: $PRINTER_PORT"
echo ""

# Test connectivity
echo "Step 1: Testing connectivity..."
echo -n "  Ping test: "
if ping -c 1 -W 1 $PRINTER_IP >/dev/null 2>&1; then
    echo "✅ Printer responds to ping"
else
    echo "⚠️  No ping response (may be normal if ping is disabled)"
fi

echo -n "  Port $PRINTER_PORT test: "
if timeout 1 bash -c "echo >/dev/tcp/$PRINTER_IP/$PRINTER_PORT" 2>/dev/null; then
    echo "✅ Port is OPEN"
    PORT_OPEN=true
else
    echo "❌ Port is CLOSED"
    PORT_OPEN=false
    echo ""
    echo "⚠️  Warning: Port $PRINTER_PORT is not open."
    echo "   The printer may need:"
    echo "   - Network/TCP/IP enabled in printer menu"
    echo "   - Port 9100 enabled in printer settings"
    echo "   - ESC/POS mode enabled"
    echo ""
    read -p "Continue with configuration anyway? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Configuration cancelled."
        exit 1
    fi
fi

# Test printing if port is open
if [ "$PORT_OPEN" = true ]; then
    echo ""
    echo "Step 2: Testing print connection..."
    TEST_RESPONSE=$(curl -s -X POST http://localhost:3333/print \
      -H "Content-Type: application/json" \
      -d "{\"mode\":\"LAN\",\"lan\":{\"ip\":\"$PRINTER_IP\",\"port\":$PRINTER_PORT},\"receipt\":{\"shopName\":\"Test\",\"saleNumber\":\"TEST\",\"date\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"subtotal\":\"0.00\",\"tax\":\"0.00\",\"total\":\"0.00\",\"items\":[{\"name\":\"Configuration Test\",\"qty\":1,\"unitPrice\":\"0.00\",\"total\":\"0.00\"}]},\"cut\":true}")
    
    if echo "$TEST_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Print test successful!"
    else
        echo "⚠️  Print test failed: $TEST_RESPONSE"
        echo "   Will configure anyway, but printing may not work until"
        echo "   printer network settings are properly configured."
    fi
fi

# Configure .env
echo ""
echo "Step 3: Configuring .env file..."

ENV_FILE=".env"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "PORT=3333" > "$ENV_FILE"
fi

# Update or add PRINTER_LAN_IP
if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$PRINTER_IP|" "$ENV_FILE"
    else
        sed -i "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$PRINTER_IP|" "$ENV_FILE"
    fi
    echo "✅ Updated PRINTER_LAN_IP=$PRINTER_IP"
else
    echo "PRINTER_LAN_IP=$PRINTER_IP" >> "$ENV_FILE"
    echo "✅ Added PRINTER_LAN_IP=$PRINTER_IP"
fi

# Update or add PRINTER_LAN_PORT
if grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$PRINTER_PORT|" "$ENV_FILE"
    else
        sed -i "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$PRINTER_PORT|" "$ENV_FILE"
    fi
else
    echo "PRINTER_LAN_PORT=$PRINTER_PORT" >> "$ENV_FILE"
fi
echo "✅ Added PRINTER_LAN_PORT=$PRINTER_PORT"

echo ""
echo "========================================"
echo "✅ CONFIGURATION COMPLETE!"
echo "========================================"
echo ""
echo "Printer configured in .env:"
echo "  PRINTER_LAN_IP=$PRINTER_IP"
echo "  PRINTER_LAN_PORT=$PRINTER_PORT"
echo ""
echo "Print Bridge will use LAN mode when printing."
echo ""
if [ "$PORT_OPEN" = false ]; then
    echo "⚠️  Note: Port $PRINTER_PORT was closed."
    echo "   Please enable network settings in printer menu:"
    echo "   1. Enable TCP/IP"
    echo "   2. Enable Port 9100"
    echo "   3. Then test with: ./test-print-simple.sh $PRINTER_IP"
else
    echo "✅ Ready to print! Test with:"
    echo "   ./test-print-simple.sh $PRINTER_IP"
fi
echo ""

