# USB Printing - Local & Production Setup

## ✅ Current Status

- **USB Printing**: ✅ Working
- **Printer Name**: `_USB_Receipt_Printer`
- **Print Bridge**: Running on port 3333
- **Configuration**: Saved in `.env`

## Local Testing

### Test USB Printing Locally

```bash
cd print-bridge
./test-print-usb.sh
```

Or use the comprehensive test:
```bash
./test-usb-local-production.sh
```

## Production Configuration

### Requirements

1. **Print Bridge must run on the cashier PC**
   - The Print Bridge service needs to be running on the same machine where the USB printer is connected
   - Default URL: `http://localhost:3333`

2. **Frontend Configuration**
   - Frontend automatically uses `http://localhost:3333` by default
   - This works because the frontend runs in the browser on the cashier PC
   - The browser can access `localhost:3333` where Print Bridge is running

3. **Environment Variables**

   **Print Bridge (.env):**
   ```env
   PORT=3333
   PRINTER_USB_NAME=_USB_Receipt_Printer
   ```

   **Frontend (optional):**
   ```env
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333
   ```

### Production Deployment

#### Option 1: Same Machine (Recommended)
- Print Bridge runs on cashier PC
- Frontend accesses via `localhost:3333`
- USB printer connected to same PC
- ✅ **This is the current setup and works perfectly**

#### Option 2: Different Machine
- Print Bridge runs on separate server
- Set `NEXT_PUBLIC_PRINT_BRIDGE_URL` to Print Bridge server URL
- USB printer must be accessible from Print Bridge server
- ⚠️ **Not recommended for USB printing** (USB requires local connection)

### Running Print Bridge in Production

**Development:**
```bash
cd print-bridge
npm run dev
```

**Production:**
```bash
cd print-bridge
npm run build
npm start
```

**As a Service (Recommended for Production):**

- **Windows**: Use NSSM or Windows Service
- **Linux**: Use systemd service
- **Mac**: Use launchd

See installation scripts:
- `install-service-windows.bat`
- `install-service-linux.sh`
- `install-service-mac.sh`

## Testing in Production

### Test from Frontend

The frontend automatically uses USB printing when:
- `PRINTER_USB_NAME` is set in Print Bridge `.env`
- Print Bridge is running on `localhost:3333`
- USB printer is connected

### Test via API

```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "USB",
    "usb": {
      "printerName": "_USB_Receipt_Printer"
    },
    "receipt": {
      "shopName": "Test Shop",
      "saleNumber": "TEST-001",
      "date": "2024-01-01T12:00:00Z",
      "subtotal": "100.00",
      "tax": "15.00",
      "total": "115.00",
      "items": [
        {
          "name": "Test Item",
          "qty": 1,
          "unitPrice": "100.00",
          "total": "100.00"
        }
      ]
    },
    "cut": true
  }'
```

## AUTO Mode (Recommended)

The frontend uses AUTO mode by default, which:
1. Tries LAN first (if `PRINTER_LAN_IP` is configured)
2. Falls back to USB automatically (if `PRINTER_USB_NAME` is configured)
3. Returns error only if both fail

This provides automatic redundancy:
- ✅ LAN printing when network is available
- ✅ USB printing as reliable backup
- ✅ No manual intervention needed

## Troubleshooting

### USB Printing Not Working

1. **Check printer is connected:**
   ```bash
   curl http://localhost:3333/printers
   ```
   Should list `_USB_Receipt_Printer`

2. **Check Print Bridge is running:**
   ```bash
   curl http://localhost:3333/health
   ```

3. **Check printer name matches exactly:**
   - Names are case-sensitive on Linux/Mac
   - Must match exactly as shown in `/printers` endpoint

4. **Rebuild native module if needed:**
   ```bash
   cd print-bridge
   npm rebuild printer
   ```

### Print Bridge Not Accessible

- **Local**: Ensure Print Bridge is running on `localhost:3333`
- **Network**: Check firewall allows port 3333
- **CORS**: Set `CORS_ORIGIN_ALLOW_ALL=true` in `.env` if needed (not recommended for production)

## Summary

✅ **USB printing is configured and working**
✅ **Ready for local and production use**
✅ **AUTO mode provides automatic fallback**

The current setup works perfectly for production:
- Print Bridge runs on cashier PC
- USB printer connected locally
- Frontend accesses via localhost
- Automatic USB printing on every sale

