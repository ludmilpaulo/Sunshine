# Print Bridge - Cross-Platform USB + LAN Printing

The Print Bridge now supports **true cross-platform printing** on Windows, Linux, and Mac!

## ✅ What's New

- **LAN Printing** (TCP/IP port 9100) - Works on all OS, no drivers needed
- **USB Printing** (via OS spooler) - Works on Windows/Linux/Mac using native `printer` module
- **AUTO Mode** - Tries LAN first, automatically falls back to USB
- **Printer Discovery** - List all available printers via API

## Quick Setup

### 1. Install Dependencies

```bash
cd print-bridge
npm install
```

**Note:** The `printer` package is a native module. You may need build tools:

- **Windows:** Usually works out-of-the-box
- **Linux:** `sudo apt-get install build-essential` (Debian/Ubuntu) or equivalent
- **Mac:** `xcode-select --install`

### 2. Find Your Printer Name

Start the Print Bridge:
```bash
npm run dev
```

Then in another terminal:
```bash
curl http://localhost:3333/printers
```

This will list all printers. Copy the exact name.

**Or find it manually:**

- **Windows:** Control Panel → Devices and Printers → Copy exact printer name
- **Linux:** Run `lpstat -p -d` and copy the printer name
- **Mac:** System Settings → Printers & Scanners → Copy exact printer name

### 3. Configure Environment

Create `.env` file in `print-bridge/`:

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50      # Your printer's IP (if using LAN)
PRINTER_LAN_PORT=9100             # Default port for ESC/POS
PRINTER_USB_NAME=GOINFINITY Thermal Receipt Printer  # Exact name from step 2
```

### 4. Test Printing

The frontend will automatically use AUTO mode, which:
1. Tries LAN first (if `PRINTER_LAN_IP` is set)
2. Falls back to USB (if `PRINTER_USB_NAME` is set)
3. Returns error only if both fail

## How It Works

### AUTO Mode (Recommended)

When you complete a sale in the POS:

```typescript
// Frontend automatically sends both LAN and USB config
await printApi.printReceipt(receipt, {
  mode: "AUTO",
  lanIp: "192.168.1.50",  // From env or settings
  usbPrinterName: "GOINFINITY Thermal Receipt Printer"  // From env or settings
});
```

Print Bridge will:
1. Try LAN connection first
2. If LAN fails → automatically try USB
3. Return success with which method was used

### Manual Mode Selection

You can also force a specific mode:

**LAN Only:**
```typescript
await printApi.printReceipt(receipt, {
  mode: "LAN",
  lanIp: "192.168.1.50"
});
```

**USB Only:**
```typescript
await printApi.printReceipt(receipt, {
  mode: "USB",
  usbPrinterName: "GOINFINITY Thermal Receipt Printer"
});
```

## API Endpoints

### List Printers
```bash
GET http://localhost:3333/printers

Response:
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

### Print Receipt
```bash
POST http://localhost:3333/print

Body:
{
  "mode": "AUTO",
  "lan": {
    "ip": "192.168.1.50",
    "port": 9100
  },
  "usb": {
    "printerName": "GOINFINITY Thermal Receipt Printer"
  },
  "receipt": { ... },
  "cut": true,
  "openCashDrawer": false
}
```

## Troubleshooting

### USB Printing Issues

1. **Printer name doesn't match:**
   - Names are case-sensitive on Linux/Mac
   - Must match exactly, including spaces
   - Use `/printers` endpoint to verify

2. **Printer driver not installed:**
   - Install printer driver from manufacturer
   - Test printing from OS first
   - If OS printing works, Print Bridge will work

3. **Build errors:**
   - Install build tools (see Quick Setup)
   - On Linux: `sudo apt-get install build-essential`
   - On Mac: `xcode-select --install`

### LAN Printing Issues

1. **Can't connect:**
   - Verify printer IP: `ping 192.168.1.50`
   - Test port: `telnet 192.168.1.50 9100`
   - Check firewall settings

2. **Printer not on network:**
   - Connect printer via Ethernet
   - Assign static IP in router or printer settings
   - Verify printer is on same network as cashier PC

## Production Deployment

See `print-bridge/README.md` for detailed deployment instructions for:
- Windows (NSSM)
- Linux (systemd)
- Mac (launchd)

## Benefits

✅ **No driver headaches** - Uses OS print spooler (driver already installed)
✅ **Automatic fallback** - LAN fails? USB takes over automatically
✅ **Cross-platform** - Same code works on Windows/Linux/Mac
✅ **Fast** - LAN is fastest, USB is reliable backup
✅ **Easy setup** - Just find printer name and configure

The Print Bridge is now truly production-ready for any shop setup! 🎉

