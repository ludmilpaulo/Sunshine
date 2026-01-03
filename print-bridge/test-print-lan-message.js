#!/usr/bin/env node

/**
 * Test script to print "the printer is connected to the LAN"
 * Usage: node test-print-lan-message.js [printer-ip] [port]
 */

const PRINTER_IP = process.argv[2] || process.env.PRINTER_LAN_IP;
const PRINTER_PORT = parseInt(process.argv[3] || process.env.PRINTER_LAN_PORT || "9100");
const PRINT_BRIDGE_URL = process.env.PRINT_BRIDGE_URL || "http://localhost:3333";

if (!PRINTER_IP) {
  console.error("❌ Error: Printer IP not provided");
  console.error("");
  console.error("Usage:");
  console.error("  node test-print-lan-message.js <printer-ip> [port]");
  console.error("");
  console.error("Or set environment variables:");
  console.error("  export PRINTER_LAN_IP=192.168.1.50");
  console.error("  export PRINTER_LAN_PORT=9100");
  console.error("  node test-print-lan-message.js");
  process.exit(1);
}

console.log("========================================");
console.log("TEST PRINT: Printer LAN Connection");
console.log("========================================");
console.log("");
console.log("Configuration:");
console.log(`  Printer IP: ${PRINTER_IP}`);
console.log(`  Printer Port: ${PRINTER_PORT}`);
console.log(`  Print Bridge URL: ${PRINT_BRIDGE_URL}`);
console.log("");

// Check if Print Bridge is running
async function checkPrintBridge() {
  try {
    // Use dynamic import for fetch or http module
    let fetchFn;
    try {
      // Try native fetch (Node 18+)
      fetchFn = fetch;
    } catch {
      // Fallback to http module
      const http = await import("http");
      fetchFn = (url, options) => {
        return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port || 3333,
            path: urlObj.pathname,
            method: options?.method || "GET",
            headers: options?.headers || {},
          }, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                json: () => Promise.resolve(JSON.parse(data)),
              });
            });
          });
          req.on("error", reject);
          if (options?.body) {
            req.write(options.body);
          }
          req.end();
        });
      };
    }
    
    const response = await fetchFn(`${PRINT_BRIDGE_URL}/health`);
    if (response.ok) {
      console.log("✅ Print Bridge is running");
      return { fetchFn, running: true };
    }
  } catch (error) {
    console.error("❌ Print Bridge is not running");
    console.error(`   Make sure Print Bridge is running at ${PRINT_BRIDGE_URL}`);
    console.error("   Start it with: npm run dev");
    return { running: false };
  }
  return { running: false };
}

// Send print request
async function testPrint() {
  const bridgeStatus = await checkPrintBridge();
  if (!bridgeStatus.running) {
    process.exit(1);
  }

  const fetchFn = bridgeStatus.fetchFn || fetch;

  console.log("🖨️  Sending test print...");
  console.log("");

  const testPayload = {
    mode: "LAN",
    lan: {
      ip: PRINTER_IP,
      port: PRINTER_PORT,
    },
    receipt: {
      shopName: "Test Connection",
      saleNumber: "TEST-LAN-001",
      date: new Date().toISOString(),
      subtotal: "0.00",
      tax: "0.00",
      total: "0.00",
      items: [
        {
          name: "the printer is connected to the LAN",
          qty: 1,
          unitPrice: "0.00",
          total: "0.00",
        },
      ],
      footer: "LAN Connection Test",
    },
    cut: true,
    openCashDrawer: false,
  };

  try {
    const response = await fetchFn(`${PRINT_BRIDGE_URL}/print`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (response.ok && result.ok) {
      console.log("✅ Print sent successfully!");
      console.log(`   Method used: ${result.used}`);
      console.log("");
      console.log("Check your printer - it should have printed:");
      console.log('   "the printer is connected to the LAN"');
    } else {
      console.error("❌ Print failed");
      console.error("");
      console.error("Response:", JSON.stringify(result, null, 2));
      console.error("");
      console.error("Troubleshooting:");
      console.error("  - Verify printer IP is correct");
      console.error("  - Check printer is powered on and connected to network");
      console.error("  - Test connection: ping " + PRINTER_IP);
      console.error("  - Test port: telnet " + PRINTER_IP + " " + PRINTER_PORT);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error sending print request:");
    console.error("   " + error.message);
    process.exit(1);
  }
}

testPrint();

