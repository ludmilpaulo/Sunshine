import net from "node:net";
import dns from "node:dns";

export interface DiscoveredPrinter {
  ip: string;
  port: number;
  hostname?: string;
  name?: string;
  type: "LAN";
}

/**
 * Discover printers on the local network
 * Uses multiple strategies:
 * 1. mDNS/Bonjour service discovery (if available)
 * 2. Network scanning for common printer ports
 * 3. DNS lookup by hostname
 */
export class PrinterDiscovery {
  private static readonly COMMON_PORTS = [9100, 515, 631, 9101, 9102];
  private static readonly SCAN_TIMEOUT = 2000; // 2 seconds per IP
  private static readonly MAX_SCAN_RANGE = 50; // Scan up to 50 IPs

  /**
   * Try to resolve printer by hostname (e.g., "EPSON-PRINTER.local")
   */
  static async resolveByHostname(hostname: string): Promise<DiscoveredPrinter | null> {
    return new Promise((resolve) => {
      dns.lookup(hostname, { family: 4 }, (err, address) => {
        if (err || !address) {
          resolve(null);
          return;
        }

        // Test if it's a printer by checking port 9100
        this.testPrinterPort(address, 9100)
          .then((isPrinter) => {
            if (isPrinter) {
              resolve({
                ip: address,
                port: 9100,
                hostname,
                name: hostname.replace(".local", ""),
                type: "LAN",
              });
            } else {
              resolve(null);
            }
          })
          .catch(() => resolve(null));
      });
    });
  }

  /**
   * Test if an IP:port combination is a printer
   */
  static async testPrinterPort(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 1000; // 1 second timeout

      socket.setTimeout(timeout);
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });

      socket.once("error", () => {
        resolve(false);
      });

      socket.connect(port, ip, () => {
        socket.destroy();
        resolve(true);
      });
    });
  }

  /**
   * Scan local network for printers
   * Scans common printer ports on local subnet
   */
  static async scanLocalNetwork(): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = [];
    
    // Get local IP to determine subnet
    const localIP = await this.getLocalIP();
    if (!localIP) {
      console.warn("Could not determine local IP address");
      return printers;
    }

    const subnet = this.getSubnet(localIP);
    console.log(`Scanning subnet ${subnet} for printers...`);

    // Scan common IPs in subnet (last octet 1-50)
    const scanPromises: Promise<void>[] = [];
    let scanned = 0;

    for (let i = 1; i <= this.MAX_SCAN_RANGE && scanned < this.MAX_SCAN_RANGE; i++) {
      const ip = `${subnet}.${i}`;
      
      // Skip our own IP
      if (ip === localIP) continue;

      for (const port of this.COMMON_PORTS) {
        scanPromises.push(
          this.testPrinterPort(ip, port).then((isPrinter) => {
            if (isPrinter) {
              printers.push({
                ip,
                port,
                type: "LAN",
                name: `Printer ${ip}:${port}`,
              });
              console.log(`Found printer at ${ip}:${port}`);
            }
          })
        );
        scanned++;
      }
    }

    await Promise.all(scanPromises);
    return printers;
  }

  /**
   * Get local IP address
   */
  private static async getLocalIP(): Promise<string | null> {
    return new Promise((resolve) => {
      const interfaces = require("os").networkInterfaces();
      
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Skip internal and non-IPv4 addresses
          if (iface.family === "IPv4" && !iface.internal) {
            resolve(iface.address);
            return;
          }
        }
      }
      resolve(null);
    });
  }

  /**
   * Get subnet from IP (e.g., "192.168.1.100" -> "192.168.1")
   */
  private static getSubnet(ip: string): string {
    const parts = ip.split(".");
    return parts.slice(0, 3).join(".");
  }

  /**
   * Auto-discover printer using multiple strategies
   * 1. Try common hostnames
   * 2. Scan local network
   */
  static async autoDiscover(): Promise<DiscoveredPrinter | null> {
    console.log("🔍 Auto-discovering printer...");

    // Strategy 1: Try common printer hostnames
    const commonHostnames = [
      "printer.local",
      "epson.local",
      "epson-printer.local",
      "star.local",
      "star-printer.local",
      "receipt-printer.local",
      "pos-printer.local",
    ];

    for (const hostname of commonHostnames) {
      const printer = await this.resolveByHostname(hostname);
      if (printer) {
        console.log(`✅ Found printer via hostname: ${hostname} -> ${printer.ip}`);
        return printer;
      }
    }

    // Strategy 2: Scan local network
    console.log("Scanning local network...");
    const printers = await this.scanLocalNetwork();
    
    if (printers.length > 0) {
      // Return first found printer (usually port 9100)
      const printer = printers.find((p) => p.port === 9100) || printers[0];
      console.log(`✅ Found printer via network scan: ${printer.ip}:${printer.port}`);
      return printer;
    }

    console.log("❌ No printer found via auto-discovery");
    return null;
  }

  /**
   * Monitor printer IP changes (re-resolve hostname periodically)
   */
  static async monitorPrinter(
    hostname: string,
    callback: (printer: DiscoveredPrinter | null) => void,
    intervalMs: number = 30000 // Check every 30 seconds
  ): Promise<() => void> {
    let currentIP: string | null = null;

    const check = async () => {
      const printer = await this.resolveByHostname(hostname);
      
      if (printer && printer.ip !== currentIP) {
        if (currentIP) {
          console.log(`🔄 Printer IP changed: ${currentIP} -> ${printer.ip}`);
        }
        currentIP = printer.ip;
        callback(printer);
      } else if (!printer && currentIP) {
        console.log(`⚠️  Printer ${hostname} no longer reachable`);
        currentIP = null;
        callback(null);
      }
    };

    // Check immediately
    await check();

    // Then check periodically
    const interval = setInterval(check, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

