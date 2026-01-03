#!/bin/bash

# Comprehensive printer finder - scans all methods

echo "========================================"
echo "🔍 COMPREHENSIVE PRINTER FINDER"
echo "========================================"
echo ""

SUBNET="192.168.1"
FOUND_IPS=()

# Method 1: Check ARP table for active devices
echo "Method 1: Checking ARP table for active devices..."
ARP_IPS=$(arp -a | grep "$SUBNET\." | awk '{print $2}' | tr -d '()' | sort -u)
echo "   Found $(echo "$ARP_IPS" | wc -l | tr -d ' ') active devices in ARP table"
for ip in $ARP_IPS; do
    echo "   - $ip"
done
echo ""

# Method 2: Quick scan of common printer IPs
echo "Method 2: Scanning common printer IPs..."
COMMON_IPS="2 10 20 30 40 50 60 70 80 90 100 101 102 103 104 105 200"
for last in $COMMON_IPS; do
    ip="$SUBNET.$last"
    for port in 9100 9101; do
        if timeout 0.5 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
            echo "   ✅ FOUND: $ip:$port"
            FOUND_IPS+=("$ip:$port")
        fi
    done
done
echo ""

# Method 3: Full network scan (if not found yet)
if [ ${#FOUND_IPS[@]} -eq 0 ]; then
    echo "Method 3: Full network scan (this will take 2-3 minutes)..."
    echo "   Scanning 192.168.1.2-254 on ports 9100 and 9101..."
    echo ""
    
    for i in {2..254}; do
        ip="$SUBNET.$i"
        
        # Progress indicator
        if [ $((i % 50)) -eq 0 ]; then
            echo -ne "\r   Progress: $i/253 IPs scanned..."
        fi
        
        # Test ports
        for port in 9100 9101; do
            if timeout 0.2 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
                echo ""
                echo "   ✅✅✅ FOUND PRINTER: $ip:$port ✅✅✅"
                FOUND_IPS+=("$ip:$port")
            fi
        done
    done
    echo ""
    echo ""
fi

# Method 4: Check for other common printer ports
if [ ${#FOUND_IPS[@]} -eq 0 ]; then
    echo "Method 4: Checking other printer ports (515, 631)..."
    for i in {2..100}; do
        ip="$SUBNET.$i"
        for port in 515 631; do
            if timeout 0.2 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
                echo "   ⚠️  Found device on port $port: $ip (may not be ESC/POS printer)"
                FOUND_IPS+=("$ip:$port")
            fi
        done
    done
    echo ""
fi

# Results
echo "========================================"
if [ ${#FOUND_IPS[@]} -gt 0 ]; then
    echo "✅ PRINTER(S) FOUND!"
    echo "========================================"
    echo ""
    for printer in "${FOUND_IPS[@]}"; do
        IP=$(echo $printer | cut -d':' -f1)
        PORT=$(echo $printer | cut -d':' -f2)
        echo "   IP: $IP"
        echo "   Port: $PORT"
        echo ""
        echo "   Test printing:"
        echo "     ./test-print-simple.sh $IP $PORT"
        echo ""
    done
    
    # Auto-configure if only one found
    if [ ${#FOUND_IPS[@]} -eq 1 ]; then
        IP=$(echo ${FOUND_IPS[0]} | cut -d':' -f1)
        PORT=$(echo ${FOUND_IPS[0]} | cut -d':' -f2)
        
        echo "   Would you like to configure this automatically? (y/n)"
        read -p "   > " CONFIGURE
        
        if [[ "$CONFIGURE" =~ ^[Yy]$ ]]; then
            ENV_FILE=".env"
            if [ ! -f "$ENV_FILE" ]; then
                echo "PORT=3333" > "$ENV_FILE"
            fi
            
            if grep -q "^PRINTER_LAN_IP=" "$ENV_FILE"; then
                sed -i.bak "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$IP|" "$ENV_FILE" 2>/dev/null || \
                sed -i '' "s|^PRINTER_LAN_IP=.*|PRINTER_LAN_IP=$IP|" "$ENV_FILE"
            else
                echo "PRINTER_LAN_IP=$IP" >> "$ENV_FILE"
            fi
            
            if grep -q "^PRINTER_LAN_PORT=" "$ENV_FILE"; then
                sed -i.bak "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$PORT|" "$ENV_FILE" 2>/dev/null || \
                sed -i '' "s|^PRINTER_LAN_PORT=.*|PRINTER_LAN_PORT=$PORT|" "$ENV_FILE"
            else
                echo "PRINTER_LAN_PORT=$PORT" >> "$ENV_FILE"
            fi
            
            echo ""
            echo "   ✅ Configuration saved to .env!"
            echo "   PRINTER_LAN_IP=$IP"
            echo "   PRINTER_LAN_PORT=$PORT"
        fi
    fi
else
    echo "❌ PRINTER NOT FOUND"
    echo "========================================"
    echo ""
    echo "The printer is not responding on common ports."
    echo ""
    echo "Please try:"
    echo "  1. Check printer menu for Network Settings → IP Address"
    echo "  2. Print a network configuration page from printer"
    echo "  3. Check router admin (192.168.1.1) → Ethernet/Wired Devices"
    echo "  4. Verify printer is powered on and Ethernet cable is connected"
    echo "  5. Wait 1-2 minutes after connecting, then try again"
    echo ""
    echo "If you know the IP, test it with:"
    echo "  ./test-print-simple.sh <ip-address>"
fi

echo ""
echo "========================================"

