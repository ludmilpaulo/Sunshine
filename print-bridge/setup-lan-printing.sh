#!/bin/bash

# Interactive script to set up LAN printing

echo "========================================"
echo "🖨️  SETUP LAN PRINTING"
echo "========================================"
echo ""

# Step 1: Check if printer is connected
echo "Step 1: Checking printer connection..."
echo ""
echo "Please ensure:"
echo "  ✅ Printer is powered ON"
echo "  ✅ Ethernet cable is connected from printer to router"
echo "  ✅ Wait 30-60 seconds after connecting"
echo ""
read -p "Press Enter when printer is connected to network..."

# Step 2: Scan for printer
echo ""
echo "Step 2: Scanning network for printer..."
echo "This may take a few minutes..."
echo ""

cd "$(dirname "$0")"

# Quick scan of common IPs first
FOUND_IP=""
for ip in 192.168.1.50 192.168.1.100 192.168.1.200 192.168.1.2 192.168.1.10 192.168.1.20 192.168.1.30; do
    echo -n "Testing $ip:9100... "
    if timeout 0.5 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
        echo "✅ FOUND!"
        FOUND_IP=$ip
        break
    else
        echo "❌"
    fi
done

# If not found, do broader scan
if [ -z "$FOUND_IP" ]; then
    echo ""
    echo "Not found in common IPs. Scanning broader range..."
    echo "This will take 2-3 minutes..."
    echo ""
    
    for i in {2..100}; do
        ip="192.168.1.$i"
        if [ $((i % 20)) -eq 0 ]; then
            echo -ne "\r   Scanned $i/99 IPs..."
        fi
        
        if timeout 0.3 bash -c "echo >/dev/tcp/$ip/9100" 2>/dev/null; then
            echo ""
            echo "✅ FOUND PRINTER: $ip:9100"
            FOUND_IP=$ip
            break
        fi
    done
    echo ""
fi

# Step 3: Handle results
if [ -z "$FOUND_IP" ]; then
    echo "❌ Printer not found on network"
    echo ""
    echo "Please try:"
    echo "  1. Check printer menu for Network Settings → IP Address"
    echo "  2. Print a network configuration page from printer"
    echo "  3. Check router admin panel for wired/Ethernet devices"
    echo "  4. Verify Ethernet cable is connected"
    echo ""
    read -p "Do you know the printer IP address? (y/n): " KNOW_IP
    
    if [[ "$KNOW_IP" =~ ^[Yy]$ ]]; then
        read -p "Enter printer IP address: " FOUND_IP
    else
        echo ""
        echo "Please find the IP address using one of the methods above,"
        echo "then run: ./test-print-simple.sh <printer-ip>"
        exit 1
    fi
fi

# Step 4: Test the connection
echo ""
echo "Step 3: Testing printer connection..."
echo "Printer IP: $FOUND_IP"
echo ""

if [ -f "./test-print-simple.sh" ]; then
    ./test-print-simple.sh "$FOUND_IP"
    TEST_RESULT=$?
else
    echo "⚠️  Test script not found, skipping test"
    TEST_RESULT=0
fi

# Step 5: Configure .env file
if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo "Step 4: Configuring Print Bridge..."
    echo ""
    
    ENV_FILE=".env"
    
    # Create .env if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        echo "PORT=3333" > "$ENV_FILE"
    fi
    
    # Update or add PRINTER_LAN_IP
    if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
        sed -i.bak "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$FOUND_IP|" "$ENV_FILE"
        echo "✅ Updated PRINTER_LAN_IP=$FOUND_IP"
    else
        echo "PRINTER_LAN_IP=$FOUND_IP" >> "$ENV_FILE"
        echo "✅ Added PRINTER_LAN_IP=$FOUND_IP"
    fi
    
    # Update or add PRINTER_LAN_PORT
    if grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
        sed -i.bak "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=9100|" "$ENV_FILE"
    else
        echo "PRINTER_LAN_PORT=9100" >> "$ENV_FILE"
    fi
    echo "✅ Added PRINTER_LAN_PORT=9100"
    
    echo ""
    echo "========================================"
    echo "✅ LAN PRINTING CONFIGURED!"
    echo "========================================"
    echo ""
    echo "Configuration saved to .env:"
    echo "  PRINTER_LAN_IP=$FOUND_IP"
    echo "  PRINTER_LAN_PORT=9100"
    echo ""
    echo "Print Bridge will now use LAN mode automatically."
    echo ""
    echo "To test again, run:"
    echo "  ./test-print-simple.sh $FOUND_IP"
    echo ""
else
    echo ""
    echo "⚠️  Test failed. Please verify:"
    echo "  - Printer IP is correct: $FOUND_IP"
    echo "  - Printer is powered on"
    echo "  - Ethernet cable is connected"
    echo "  - Printer supports ESC/POS on port 9100"
    echo ""
    echo "You can still add the IP to .env manually:"
    echo "  PRINTER_LAN_IP=$FOUND_IP"
    echo "  PRINTER_LAN_PORT=9100"
fi

