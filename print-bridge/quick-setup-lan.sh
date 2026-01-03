#!/bin/bash

# Quick setup - just scan and configure

echo "🔍 Scanning for printer on network..."
echo ""

FOUND_IP=""

# Quick scan of most common printer IPs
for ip in 192.168.1.50 192.168.1.100 192.168.1.200 192.168.1.2 192.168.1.10 192.168.1.20 192.168.1.30 192.168.1.40 192.168.1.60 192.168.1.70 192.168.1.80 192.168.1.90; do
    if timeout 0.5 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
        echo "✅ Found printer at: $ip:9100"
        FOUND_IP=$ip
        break
    fi
done

if [ -z "$FOUND_IP" ]; then
    echo "❌ Printer not found automatically"
    echo ""
    echo "Please:"
    echo "  1. Connect printer via Ethernet cable to router"
    echo "  2. Check printer menu for IP address"
    echo "  3. Or run: ./setup-lan-printing.sh (interactive setup)"
    echo ""
    exit 1
fi

# Test the connection
echo ""
echo "🧪 Testing connection..."
RESPONSE=$(curl -s -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d "{\"mode\":\"LAN\",\"lan\":{\"ip\":\"$FOUND_IP\",\"port\":9100},\"receipt\":{\"shopName\":\"Test\",\"saleNumber\":\"TEST\",\"date\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"subtotal\":\"0.00\",\"tax\":\"0.00\",\"total\":\"0.00\",\"items\":[{\"name\":\"Connection Test\",\"qty\":1,\"unitPrice\":\"0.00\",\"total\":\"0.00\"}]},\"cut\":true}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Connection test successful!"
else
    echo "⚠️  Connection test failed, but will configure anyway"
fi

# Configure .env
echo ""
echo "📝 Configuring .env file..."

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "PORT=3333" > "$ENV_FILE"
fi

# Update PRINTER_LAN_IP
if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
    sed -i.bak "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$FOUND_IP|" "$ENV_FILE" 2>/dev/null || \
    sed -i '' "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$FOUND_IP|" "$ENV_FILE"
else
    echo "PRINTER_LAN_IP=$FOUND_IP" >> "$ENV_FILE"
fi

# Update PRINTER_LAN_PORT
if ! grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
    echo "PRINTER_LAN_PORT=9100" >> "$ENV_FILE"
fi

echo "✅ Configuration saved!"
echo ""
echo "PRINTER_LAN_IP=$FOUND_IP"
echo "PRINTER_LAN_PORT=9100"
echo ""
echo "LAN printing is now configured! 🎉"

