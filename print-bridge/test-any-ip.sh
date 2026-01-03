#!/bin/bash
# Test any IP address for printer connectivity

if [ -z "$1" ]; then
  echo "Usage: ./test-any-ip.sh <ip-address> [port]"
  echo ""
  echo "Example:"
  echo "  ./test-any-ip.sh 192.168.1.56"
  echo "  ./test-any-ip.sh 192.168.1.56 9100"
  exit 1
fi

IP=$1
PORT=${2:-9100}

echo "Testing $IP:$PORT..."
echo ""

# Test connectivity
echo -n "Ping test: "
ping -c 1 -W 1 $IP >/dev/null 2>&1 && echo "✅ Responds" || echo "❌ No response"

# Test port
echo -n "Port $PORT test: "
timeout 1 bash -c "echo >/dev/tcp/$IP/$PORT" 2>/dev/null && echo "✅ OPEN" || echo "❌ Closed"

# Try printing if port is open
if timeout 1 bash -c "echo >/dev/tcp/$IP/$PORT" 2>/dev/null; then
  echo ""
  echo "Port is open! Testing print..."
  ./test-print-simple.sh $IP $PORT
else
  echo ""
  echo "Port is closed. The printer might:"
  echo "  - Need network configuration enabled"
  echo "  - Use a different port"
  echo "  - Need ESC/POS mode enabled"
fi
