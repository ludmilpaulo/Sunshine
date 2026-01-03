#!/bin/bash

# Comprehensive printer port scanner
# Scans common printer ports (9100, 9101, 515, 631) on local network

echo "========================================"
echo "🔍 SCANNING FOR PRINTER PORTS"
echo "========================================"
echo ""

# Get local IP and subnet
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
SUBNET=$(echo $LOCAL_IP | cut -d'.' -f1-3)

echo "Network: $SUBNET.x"
echo "Scanning ports: 9100 (ESC/POS), 9101, 515 (LPR), 631 (IPP)"
echo "This may take a few minutes..."
echo ""

FOUND=0

# Function to test port
test_port() {
    local ip=$1
    local port=$2
    local timeout=0.5
    
    if timeout $timeout bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
        return 0
    fi
    return 1
}

# Get list of IPs to scan from ARP table first
ARP_IPS=$(arp -a | grep -E "192\.168\.1\." | awk '{print $2}' | tr -d '()' | sort -u)

echo "📋 Testing devices from ARP table first..."
for ip in $ARP_IPS; do
    if [ "$ip" = "$LOCAL_IP" ]; then
        continue
    fi
    
    for port in 9100 9101 515 631; do
        if test_port "$ip" "$port"; then
            echo "✅ FOUND: $ip:$port (Printer port open!)"
            FOUND=1
        fi
    done
done

echo ""
echo "📋 Scanning common printer IP ranges..."

# Scan common printer IP ranges
COMMON_RANGES="50 100 200 2 10 20 30 40 60 70 80 90 101 102 103 104 105"

for last_octet in $COMMON_RANGES; do
    IP="$SUBNET.$last_octet"
    
    if [ "$IP" = "$LOCAL_IP" ]; then
        continue
    fi
    
    # Test port 9100 (most common for ESC/POS)
    if test_port "$IP" 9100; then
        echo "✅ FOUND: $IP:9100 (ESC/POS port open!)"
        FOUND=1
    fi
done

# If still not found, do a broader scan
if [ $FOUND -eq 0 ]; then
    echo ""
    echo "📋 Doing broader scan (this will take longer)..."
    echo "   Scanning IPs 1-100 on port 9100..."
    
    for i in {1..100}; do
        IP="$SUBNET.$i"
        
        if [ "$IP" = "$LOCAL_IP" ]; then
            continue
        fi
        
        if [ $((i % 20)) -eq 0 ]; then
            echo -ne "\r   Progress: $i/100 IPs tested..."
        fi
        
        if test_port "$IP" 9100; then
            echo ""
            echo "✅ FOUND: $IP:9100 (ESC/POS port open!)"
            FOUND=1
        fi
    done
    echo ""
fi

echo ""
if [ $FOUND -eq 0 ]; then
    echo "❌ No printer ports found on network"
    echo ""
    echo "💡 Try these methods:"
    echo "   1. Check printer menu for Network Settings"
    echo "   2. Access router at http://$SUBNET.1"
    echo "   3. Print a test page from printer"
    echo "   4. Verify printer is powered on and connected to network"
else
    echo "========================================"
    echo "✅ PRINTER FOUND!"
    echo "========================================"
    echo ""
    echo "To test printing, run:"
    echo "  node test-print-lan-message.js <printer-ip>"
    echo ""
    echo "Or add to .env:"
    echo "  PRINTER_LAN_IP=<printer-ip>"
    echo "  PRINTER_LAN_PORT=9100"
fi

