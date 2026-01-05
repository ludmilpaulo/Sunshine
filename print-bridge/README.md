# Print Bridge

Local print service for thermal receipt printers (ESC/POS). Cross-platform support for **Windows, Linux, and Mac**.

Runs on the cashier PC and handles printing to USB or LAN-connected thermal printers.

## Features

- ✅ **LAN Printing** (TCP/IP port 9100) - Works on all OS
- ✅ **USB Printing** (via OS spooler) - Works on Windows/Linux/Mac
- ✅ **AUTO Mode** - Tries LAN first, falls back to USB
- ✅ **Printer Discovery** - List available printers via API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure printer settings:
```bash
cp .env.example .env
# Edit .env with your printer settings
```

3. Run in development:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Environment Variables

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50      # Printer IP (if using LAN)
PRINTER_LAN_PORT=9100             # Printer port (default: 9100)
PRINTER_USB_NAME=Printer Name    # Exact printer name from OS
```

## Finding Your Printer Name

### Windows
1. Open Control Panel → Devices and Printers
2. Find your thermal printer
3. Copy the exact name (e.g., "GOINFINITY Thermal Receipt Printer")

### Linux (CUPS)
1. Run: `lpstat -p -d`
2. Copy the printer name from the output

### Mac
1. System Settings → Printers & Scanners
2. Find your printer and copy the exact name

### Via API
Once Print Bridge is running:
```bash
curl http://localhost:3333/printers
```

This returns all available printers with their names.

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "service": "print-bridge"
}
```

### `GET /printers`
List all available printers on the system.

**Response:**
```json
{
  "printers": [
    {
      "name": "GOINFINITY Thermal Receipt Printer",
      "status": 0,
      "isDefault": true
    }
  ]
}
```

### `POST /print`
Print a receipt.

**Request Body:**
```json
{
  "mode": "LAN" | "USB" | "AUTO",
  "lan": {
    "ip": "192.168.1.50",
    "port": 9100
  },
  "usb": {
    "printerName": "GOINFINITY Thermal Receipt Printer"
  },
  "receipt": {
    "shopName": "Sunshine Shop",
    "saleNumber": "S20240101120000",
    "date": "2024-01-01T12:00:00Z",
    "subtotal": "100.00",
    "tax": "15.00",
    "total": "115.00",
    "items": [
      {
        "name": "Product Name",
        "qty": 2,
        "unitPrice": "50.00",
        "total": "100.00"
      }
    ]
  },
  "cut": true,
  "openCashDrawer": false
}
```

**Response:**
```json
{
  "ok": true,
  "used": "LAN" | "USB"
}
```

## Printing Modes

### LAN Mode
Direct TCP/IP connection to printer. Fastest and most reliable.

**Requirements:**
- Printer connected to network via Ethernet
- Static IP assigned to printer
- Port 9100 accessible

### USB Mode
Uses OS print spooler with RAW ESC/POS data.

**Requirements:**
- Printer driver installed
- Printer name must match exactly (case-sensitive on Linux/Mac)

### AUTO Mode (Recommended)
1. Tries LAN first
2. If LAN fails, falls back to USB
3. Returns error only if both fail

## Usage Examples

### Print via LAN
```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {"ip": "192.168.1.50", "port": 9100},
    "receipt": { ... }
  }'
```

### Print via USB
```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "USB",
    "usb": {"printerName": "GOINFINITY Thermal Receipt Printer"},
    "receipt": { ... }
  }'
```

### Print with AUTO (LAN → USB fallback)
```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "AUTO",
    "lan": {"ip": "192.168.1.50"},
    "usb": {"printerName": "GOINFINITY Thermal Receipt Printer"},
    "receipt": { ... }
  }'
```

## Troubleshooting

### USB Printing Not Working

1. **Verify printer name:**
   ```bash
   curl http://localhost:3333/printers
   ```
   Ensure the name matches exactly (including spaces and capitalization).

2. **Check printer driver:**
   - Windows: Device Manager → Printers
   - Linux: `lpstat -p`
   - Mac: System Settings → Printers

3. **Test printer manually:**
   - Print a test page from OS
   - If OS printing works, Print Bridge should work

### LAN Printing Not Working

1. **Check printer IP:**
   ```bash
   ping 192.168.1.50
   ```

2. **Test port connectivity:**
   ```bash
   telnet 192.168.1.50 9100
   # or
   nc -zv 192.168.1.50 9100
   ```

3. **Verify printer network settings:**
   - Ensure printer has static IP
   - Check firewall rules

### Build Errors (Native Module)

The `printer` package is a native module. If build fails:

**Windows:**
- Usually works out-of-the-box
- May need Visual Studio Build Tools

**Linux:**
```bash
sudo apt-get install build-essential
npm install
```

**Mac:**
```bash
xcode-select --install
npm install
```

## Security

- Print Bridge only accepts connections from `localhost` by default
- For production, add authentication or restrict network access
- Consider running behind a reverse proxy with authentication

## Production Deployment

### Quick Setup (Auto-Start)

For production deployment with automatic startup, use the installation scripts:

**macOS/Linux:**
```bash
cd print-bridge
npm run build  # Build first
./install-auto-start.sh  # Auto-detects OS and installs service
```

**Windows:**
```powershell
cd print-bridge
npm run build  # Build first
.\install-service-windows.bat  # Requires NSSM
```

### Manual Installation

1. Build the service:
```bash
npm run build
```

2. Run as a service:

**Windows (NSSM):**
```bash
nssm install PrintBridge "C:\path\to\node.exe" "C:\path\to\dist\index.js"
nssm set PrintBridge AppDirectory "C:\path\to\print-bridge"
nssm set PrintBridge Start SERVICE_AUTO_START
nssm start PrintBridge
```

**Linux (systemd):**
Create `/etc/systemd/system/print-bridge.service`:
```ini
[Unit]
Description=Print Bridge Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/print-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable print-bridge
sudo systemctl start print-bridge
```

**Mac (launchd):**
Create `~/Library/LaunchAgents/com.sunshine.printbridge.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.sunshine.printbridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/print-bridge/dist/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/path/to/print-bridge</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

Then:
```bash
launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
```

📖 **See `PRODUCTION_DEPLOYMENT.md` for detailed installation instructions.**
