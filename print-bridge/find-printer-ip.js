#!/usr/bin/env node

/**
 * Helper script to find printer IP using multiple methods
 */

import os from "os";
import { execSync } from "child_process";

console.log("========================================");
console.log("🔍 FINDING PRINTER IP ADDRESS");
console.log("========================================");
console.log("");

// Method 1: Check Print Bridge discover endpoint
async function checkPrintBridgeDiscovery() {
  console.log("Method 1: Checking Print Bridge auto-discovery...");
  try {
    const response = await fetch("http://localhost:3333/discover");
    const result = await response.json();
    
    if (result.success && result.printer) {
      console.log("✅ Found printer via auto-discovery!");
      console.log(`   IP: ${result.printer.ip}`);
      console.log(`   Port: ${result.printer.port}`);
      console.log(`   Hostname: ${result.printer.hostname || "N/A"}`);
      return result.printer;
    }
  } catch (error) {
    console.log("   ⚠️  Print Bridge not running or discovery failed");
  }
  console.log("");
  return null;
}

// Method 2: Get local network info
function getNetworkInfo() {
  console.log("Method 2: Checking local network configuration...");
  const interfaces = os.networkInterfaces();
  const localIPs = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        localIPs.push({
          interface: name,
          ip: iface.address,
          netmask: iface.netmask,
        });
        console.log(`   Interface: ${name}`);
        console.log(`   IP Address: ${iface.address}`);
        console.log(`   Subnet: ${getSubnet(iface.address)}.x`);
      }
    }
  }
  console.log("");
  return localIPs;
}

function getSubnet(ip) {
  const parts = ip.split(".");
  return parts.slice(0, 3).join(".");
}

// Method 3: Check ARP table
function checkARPTable() {
  console.log("Method 3: Checking ARP table (recently connected devices)...");
  try {
    const arpOutput = execSync("arp -a", { encoding: "utf8" });
    const lines = arpOutput.split("\n");
    const devices = [];
    
    for (const line of lines) {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        const ip = match[1];
        const subnet = getSubnet(ip);
        // Only show devices in common private subnets
        if (subnet.startsWith("192.168.") || subnet.startsWith("10.") || subnet.startsWith("172.")) {
          devices.push(ip);
        }
      }
    }
    
    if (devices.length > 0) {
      console.log(`   Found ${devices.length} devices in ARP table:`);
      devices.slice(0, 10).forEach((ip, i) => {
        console.log(`   ${i + 1}. ${ip}`);
      });
      if (devices.length > 10) {
        console.log(`   ... and ${devices.length - 10} more`);
      }
    } else {
      console.log("   No devices found in ARP table");
    }
  } catch (error) {
    console.log("   ⚠️  Could not read ARP table");
  }
  console.log("");
}

// Method 4: Get gateway/router IP
function getGateway() {
  console.log("Method 4: Finding router/gateway IP...");
  try {
    if (process.platform === "darwin") {
      const gateway = execSync("route -n get default | grep gateway", { encoding: "utf8" });
      const match = gateway.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        console.log(`   Gateway/Router: ${match[1]}`);
        console.log(`   💡 Access router admin at: http://${match[1]}`);
        console.log(`   💡 Look for "Connected Devices" or "DHCP Clients" section`);
        return match[1];
      }
    } else if (process.platform === "win32") {
      const gateway = execSync('ipconfig | findstr "Default Gateway"', { encoding: "utf8" });
      const match = gateway.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        console.log(`   Gateway/Router: ${match[1]}`);
        console.log(`   💡 Access router admin at: http://${match[1]}`);
        return match[1];
      }
    } else {
      const gateway = execSync("ip route | grep default", { encoding: "utf8" });
      const match = gateway.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        console.log(`   Gateway/Router: ${match[1]}`);
        console.log(`   💡 Access router admin at: http://${match[1]}`);
        return match[1];
      }
    }
  } catch (error) {
    console.log("   ⚠️  Could not determine gateway");
  }
  console.log("");
}

// Main function
async function main() {
  // Try auto-discovery first
  const discovered = await checkPrintBridgeDiscovery();
  if (discovered) {
    console.log("========================================");
    console.log("✅ PRINTER FOUND!");
    console.log("========================================");
    console.log("");
    console.log("To test printing, run:");
    console.log(`  node test-print-lan-message.js ${discovered.ip}`);
    console.log("");
    console.log("Or add to .env file:");
    console.log(`  PRINTER_LAN_IP=${discovered.ip}`);
    console.log(`  PRINTER_LAN_PORT=${discovered.port}`);
    return;
  }
  
  // Get network info
  const networkInfo = getNetworkInfo();
  checkARPTable();
  getGateway();
  
  // Provide manual instructions
  console.log("========================================");
  console.log("📋 MANUAL METHODS TO FIND PRINTER IP");
  console.log("========================================");
  console.log("");
  console.log("Since auto-discovery didn't find a printer, try these methods:");
  console.log("");
  console.log("1. 📱 PRINTER MENU (Easiest):");
  console.log("   - Use the buttons on your printer");
  console.log("   - Navigate to: Network Settings or TCP/IP");
  console.log("   - Look for 'IP Address' - note it down");
  console.log("");
  console.log("2. 🖨️  PRINT TEST PAGE:");
  console.log("   - Print a test page or configuration page from printer");
  console.log("   - The IP address is usually printed on the page");
  console.log("");
  console.log("3. 🌐 ROUTER ADMIN PANEL:");
  if (networkInfo.length > 0) {
    const subnet = getSubnet(networkInfo[0].ip);
    console.log(`   - Access your router at: http://${subnet}.1 (or check gateway above)`);
    console.log(`   - Login (usually admin/admin or check router label)`);
    console.log(`   - Look for: 'Connected Devices', 'DHCP Clients', or 'Network Devices'`);
    console.log(`   - Find your printer (may show as 'GO INFINITY', 'Printer', or MAC address)`);
  }
  console.log("");
  console.log("4. 🔍 NETWORK SCAN:");
  if (networkInfo.length > 0) {
    const subnet = getSubnet(networkInfo[0].ip);
    console.log(`   - Your network is: ${subnet}.x`);
    console.log(`   - Common printer IPs: ${subnet}.50, ${subnet}.100, ${subnet}.200`);
    console.log(`   - Test connection: ping ${subnet}.50`);
    console.log(`   - Test port: nc -zv ${subnet}.50 9100`);
  }
  console.log("");
  console.log("5. 📝 CHECK EXISTING CONFIG:");
  console.log("   - Check if .env file exists in print-bridge directory");
  console.log("   - Look for PRINTER_LAN_IP setting");
  console.log("");
  console.log("========================================");
  console.log("Once you have the IP, test it with:");
  console.log("  node test-print-lan-message.js <printer-ip>");
  console.log("========================================");
}

main().catch(console.error);

