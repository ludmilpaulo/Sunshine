#!/bin/bash

# Auto-configure printer - finds and sets up automatically

echo "========================================"
echo "🤖 AUTO-CONFIGURE PRINTER"
echo "========================================"
echo ""

cd "$(dirname "$0")"

FOUND_IP=""
FOUND_PORT="9100"

# Method 1: Quick scan common IPs
echo "Step 1: Quick scan of common printer IPs..."
for ip in 192.168.1.50 192.168.1.100 192.168.1.200 192.168.1.2 192.168.1.10 192.168.1.20 192.168.1.30 192.168.1.40 192.168.1.60 192.168.1.70 192.168.1.80 192.168.1.90; do
    if timeout 0.5 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
        FOUND_IP=$ip
        echo "✅ Found printer at: $ip:9100"
        break
    fi
done

# Method 2: Check ARP table devices
if [ -z "$FOUND_IP" ]; then
    echo ""
    echo "Step 2: Checking recently connected devices..."
    ARP_IPS=$(arp -a | grep "192.168.1." | awk '{print $2}' | tr -d '()' | sort -u)
    for ip in $ARP_IPS; do
        if [ "$ip" != "192.168.1.1" ] && [ "$ip" != "192.168.1.18" ]; then
            echo -n "  Testing $ip... "
            if timeout 0.5 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
                FOUND_IP=$ip
                echo "✅ Found!"
                break
            else
                echo "❌"
            fi
        fi
    done
fi

# Method 3: Full scan if still not found
if [ -z "$FOUND_IP" ]; then
    echo ""
    echo "Step 3: Full network scan (this may take 2-3 minutes)..."
    echo "   Scanning 192.168.1.2-254 on port 9100..."
    for i in {2..254}; do
        ip="192.168.1.$i"
        if [ $((i % 50)) -eq 0 ]; then
            echo -ne "\r   Progress: $i/253 IPs scanned..."
        fi
        if timeout 0.2 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
            echo ""
            echo "✅ Found printer at: $ip:9100"
            FOUND_IP=$ip
            break
        fi
    done
    echo ""
fi

# Results
echo ""
echo "========================================"
if [ -n "$FOUND_IP" ]; then
    echo "✅ PRINTER FOUND: $FOUND_IP:$FOUND_PORT"
    echo "========================================"
    echo ""
    
    # Test the connection
    echo "Step 4: Testing printer connection..."
    TEST_RESPONSE=$(curl -s -X POST http://localhost:3333/print \
      -H "Content-Type: application/json" \
      -d "{\"mode\":\"LAN\",\"lan\":{\"ip\":\"$FOUND_IP\",\"port\":$FOUND_PORT},\"receipt\":{\"shopName\":\"Test\",\"saleNumber\":\"TEST\",\"date\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"subtotal\":\"0.00\",\"tax\":\"0.00\",\"total\":\"0.00\",\"items\":[{\"name\":\"Connection Test\",\"qty\":1,\"unitPrice\":\"0.00\",\"total\":\"0.00\"}]},\"cut\":true}")
    
    if echo "$TEST_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Connection test successful!"
        TEST_SUCCESS=true
    else
        echo "⚠️  Connection test had issues, but will configure anyway"
        echo "   Response: $TEST_RESPONSE"
        TEST_SUCCESS=false
    fi
    
    echo ""
    echo "Step 5: Configuring .env file..."
    
    ENV_FILE=".env"
    
    # Create .env if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        echo "PORT=3333" > "$ENV_FILE"
    fi
    
    # Update or add PRINTER_LAN_IP
    if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$FOUND_IP|" "$ENV_FILE"
        else
            sed -i "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$FOUND_IP|" "$ENV_FILE"
        fi
        echo "✅ Updated PRINTER_LAN_IP=$FOUND_IP"
    else
        echo "PRINTER_LAN_IP=$FOUND_IP" >> "$ENV_FILE"
        echo "✅ Added PRINTER_LAN_IP=$FOUND_IP"
    fi
    
    # Update or add PRINTER_LAN_PORT
    if grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$FOUND_PORT|" "$ENV_FILE"
        else
            sed -i "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$FOUND_PORT|" "$ENV_FILE"
        fi
    else
        echo "PRINTER_LAN_PORT=$FOUND_PORT" >> "$ENV_FILE"
    fi
    echo "✅ Added PRINTER_LAN_PORT=$FOUND_PORT"
    
    echo ""
    echo "========================================"
    echo "✅✅✅ CONFIGURATION COMPLETE! ✅✅✅"
    echo "========================================"
    echo ""
    echo "Printer configured:"
    echo "  IP Address: $FOUND_IP"
    echo "  Port: $FOUND_PORT"
    echo ""
    echo "Configuration saved to .env:"
    echo "  PRINTER_LAN_IP=$FOUND_IP"
    echo "  PRINTER_LAN_PORT=$FOUND_PORT"
    echo ""
    echo "Print Bridge will now use LAN mode automatically!"
    echo ""
    if [ "$TEST_SUCCESS" = true ]; then
        echo "✅ Test print was successful!"
        echo "   The printer should have printed a test receipt."
    else
        echo "⚠️  Test print had issues. You can test manually with:"
        echo "   ./test-print-simple.sh $FOUND_IP"
    fi
    echo ""
else
    echo "❌ PRINTER NOT FOUND"
    echo "========================================"
    echo ""
    echo "The printer was not found on the network."
    echo ""
    echo "Please verify:"
    echo "  1. Printer is powered ON"
    echo "  2. Ethernet cable is connected to router"
    echo "  3. Network/TCP/IP is enabled in printer menu"
    echo "  4. Port 9100 is enabled in printer settings"
    echo "  5. Wait 1-2 minutes after connecting, then try again"
    echo ""
    echo "You can also find the IP manually:"
    echo "  - Check printer menu: Network Settings → IP Address"
    echo "  - Print network config page from printer"
    echo "  - Check router admin (192.168.1.1) → Ethernet Devices"
    echo ""
    echo "Then test with:"
    echo "  ./test-print-simple.sh <printer-ip>"
    exit 1
fi

