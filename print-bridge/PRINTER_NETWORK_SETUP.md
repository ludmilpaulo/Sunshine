# Configure Printer for Network Printing

Since your printer is connected via USB, you need to configure its network settings using the printer's physical menu system.

## Quick Setup Steps

### 1. Access Printer Menu
- Use the buttons on your printer
- Press **Menu**, **Settings**, or **Setup** button
- Navigate using arrow buttons

### 2. Enable Network/TCP/IP
Navigate to:
- **Network Settings** → **TCP/IP** → **Enable TCP/IP** → **ON**
- OR: **Settings** → **Network** → **TCP/IP** → **Enable** → **ON**

### 3. Configure IP Address

**Option A: DHCP (Automatic - Easiest)**
- Set **IP Mode** to **DHCP** or **Auto**
- Printer will automatically get IP from router
- Note the IP address shown on display

**Option B: Static IP (Manual)**
- Set **IP Mode** to **Static** or **Manual**
- Enter:
  - **IP Address**: `192.168.1.50` (or any free IP in range 192.168.1.2-254)
  - **Subnet Mask**: `255.255.255.0`
  - **Gateway**: `192.168.1.1`

### 4. Enable ESC/POS Port
- Find: **Port 9100**, **RAW Port**, or **ESC/POS Port**
- Set to: **ENABLED** or **ON**

### 5. Save and Apply
- Save settings
- Printer may restart automatically

### 6. Connect Ethernet Cable
- Connect Ethernet cable from printer to router
- Wait 30-60 seconds for connection

### 7. Find IP Address
After connecting, find the IP using one of these:

**Method 1: Printer Display**
- Check printer menu: **Network Settings** → **IP Address**

**Method 2: Print Network Page**
- Use printer menu to print network configuration page
- IP address will be printed on the page

**Method 3: Router Admin**
- Access http://192.168.1.1
- Look for "Ethernet Devices" or "Wired Devices"
- Find your printer in the list

**Method 4: Network Scan**
```bash
cd print-bridge
./find-printer-comprehensive.sh
```

### 8. Test Network Printing
Once you have the IP:
```bash
cd print-bridge
./test-print-simple.sh <printer-ip>
```

For example:
```bash
./test-print-simple.sh 192.168.1.50
```

## Common Printer Menu Paths

Different printer brands use different menu structures:

**Generic/Epson style:**
- Menu → Network → TCP/IP → Enable

**Star/Bixolon style:**
- Setup → Network → TCP/IP → Enable

**GO INFINITY style:**
- Settings → Network → Enable TCP/IP

## Troubleshooting

**Printer not found after setup:**
- Verify Ethernet cable is connected
- Check printer is powered on
- Wait 1-2 minutes after connecting
- Verify TCP/IP is enabled in printer menu
- Check port 9100 is enabled

**Port 9100 closed:**
- Enable "RAW Port" or "Port 9100" in printer menu
- Enable "ESC/POS" mode
- Check printer manual for network port settings

**Can't find IP:**
- Print network configuration page from printer
- Check router admin for new wired device
- Use printer menu to display IP address

## After Configuration

Once network is configured and IP is found, add to `.env`:
```env
PRINTER_LAN_IP=<printer-ip>
PRINTER_LAN_PORT=9100
```

Print Bridge will automatically use LAN mode when `PRINTER_LAN_IP` is set.

