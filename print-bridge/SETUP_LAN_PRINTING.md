# Setting Up LAN Printing

## Step 1: Connect Printer to Network

1. **Connect Ethernet Cable:**
   - Plug an Ethernet cable from your printer to your router
   - Make sure the printer is powered on
   - Wait 30-60 seconds for the printer to get an IP address

## Step 2: Find Printer IP Address

### Method A: Printer Menu (Easiest)
1. Use the buttons on your printer
2. Navigate to: **Network Settings** → **TCP/IP** → **IP Address**
3. Note the IP address (e.g., `192.168.1.50`)

### Method B: Print Network Configuration Page
1. Use printer buttons to print a network configuration page
2. The IP address will be printed on the page

### Method C: Router Admin Panel
1. Access router at http://192.168.1.1
2. Look for "Ethernet Devices" or "Wired Devices" section
3. Find your printer (may show as "Unknown" or printer brand name)

### Method D: Network Scan (Automated)
Run the scan script to automatically find the printer:
```bash
cd print-bridge
./scan-printer-ports.sh
```

## Step 3: Test Connection

Once you have the IP address, test it:
```bash
cd print-bridge
./test-print-simple.sh <printer-ip>
```

For example:
```bash
./test-print-simple.sh 192.168.1.50
```

## Step 4: Configure Print Bridge

After successful test, add to `.env` file:
```env
PRINTER_LAN_IP=<printer-ip>
PRINTER_LAN_PORT=9100
```

The print-bridge will automatically use LAN mode when `PRINTER_LAN_IP` is set.

## Troubleshooting

- **Can't find printer IP:** Make sure Ethernet cable is connected and printer is powered on
- **Connection timeout:** Check printer is on same network (192.168.1.x)
- **Port closed:** Verify printer supports ESC/POS on port 9100
- **Still not found:** Try printer menu method (most reliable)

