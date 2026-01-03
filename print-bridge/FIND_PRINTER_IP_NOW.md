# How to Find Your Printer's IP Address

Since the printer is connected via Ethernet but not responding to scans, here are the **most reliable methods**:

## Method 1: Router Admin Panel (Most Reliable)

1. **Access Router:**
   - Open browser: http://192.168.1.1
   - Login (check router label for credentials)

2. **Find Ethernet/Wired Devices:**
   - Look for section: **"Ethernet Devices"**, **"Wired Devices"**, or **"LAN Devices"**
   - This is different from Wi-Fi devices list
   - Look for:
     - Device with unknown name
     - Device with MAC address starting with printer manufacturer codes
     - Device that just appeared (recently connected)

3. **Note the IP address** shown for the printer

## Method 2: Printer Menu (100% Accurate)

1. **Use printer buttons** to navigate menu
2. Navigate to:
   - **Network Settings** → **TCP/IP** → **IP Address**
   - OR **Network** → **Network Info**
   - OR **Settings** → **Network** → **IP Address**

3. **Note the IP address** displayed

## Method 3: Print Network Configuration Page

1. **Use printer buttons** to print network configuration
2. Look for menu option:
   - **"Print Network Config"**
   - **"Network Status"**
   - **"Print Test Page"** (may include network info)

3. **The IP address will be printed** on the page

## Method 4: Check Router DHCP Client List

1. In router admin (192.168.1.1)
2. Look for: **"DHCP Client List"** or **"Connected Devices"**
3. Find device that:
   - Just connected (recent timestamp)
   - Has unknown/unnamed device
   - Shows as "Ethernet" or "Wired" connection

## Once You Have the IP

Test it immediately:
```bash
cd print-bridge
./test-print-simple.sh <printer-ip>
```

For example:
```bash
./test-print-simple.sh 192.168.1.56
```

## If Printer Still Doesn't Respond

The printer might need:
1. **Network configuration enabled** in printer menu
2. **ESC/POS port enabled** (port 9100)
3. **Static IP assignment** instead of DHCP

Check printer manual for network setup instructions.

