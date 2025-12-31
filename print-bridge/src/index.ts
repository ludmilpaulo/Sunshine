import express from "express";
import cors from "cors";
import { z } from "zod";
import { buildReceipt } from "./escpos.js";
import { sendToLan } from "./lan.js";
import { PrinterDiscovery } from "./printer-discovery.js";
import type { PrintRequest } from "./types.js";

// USB module loading - lazy load to avoid crashes
let sendToUsbRaw: any = null;
let listPrinters: any = () => [];
let usbModuleLoaded = false;
let useLpFallback = false;

async function loadUsbModule() {
  if (usbModuleLoaded) return;
  
  const platform = process.platform;
  
  // macOS: Use lp fallback (more reliable)
  if (platform === "darwin") {
    try {
      const usbFallback = await import("./usb-fallback.js");
      sendToUsbRaw = (data: Buffer, opts: { printerName: string }) => 
        usbFallback.sendToUsbViaLp(data, opts.printerName);
      listPrinters = () => usbFallback.listPrintersViaLp();
      useLpFallback = true;
      usbModuleLoaded = true;
      console.log("✅ USB printing via lp command (macOS)");
      return;
    } catch (fallbackError: any) {
      console.warn("⚠️  lp fallback failed:", fallbackError.message?.substring(0, 100));
    }
  }
  
  // Windows/Linux: Try native printer module
  try {
    const usbModule = await import("./usb.js");
    sendToUsbRaw = usbModule.sendToUsbRaw;
    listPrinters = usbModule.listPrinters;
    usbModuleLoaded = true;
    console.log(`✅ USB printing via native module (${platform})`);
  } catch (nativeError: any) {
    console.error(`❌ Failed to load USB printing module (${platform}):`, nativeError.message);
    console.error("   This usually means:");
    console.error("   - Windows: Install Visual Studio Build Tools or rebuild the module");
    console.error("   - Linux: Install build-essential: sudo apt-get install build-essential");
    console.error("   - Run: npm install (to rebuild native modules)");
    usbModuleLoaded = true; // Mark as attempted to avoid retries
  }
}

const app = express();
// Allow CORS from localhost (for development)
app.use(cors({ 
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

const PrintSchema = z.object({
  mode: z.enum(["LAN", "USB", "AUTO"]),
  lan: z
    .object({
      ip: z.string().min(7),
      port: z.number().int().optional(),
    })
    .optional(),
  usb: z
    .object({
      printerName: z.string().min(1),
    })
    .optional(),
  receipt: z.object({
    shopName: z.string().min(1),
    shopPhone: z.string().optional(),
    shopAddress: z.string().optional(),
    saleNumber: z.string().min(1),
    date: z.string().min(1),
    subtotal: z.string().min(1),
    tax: z.string().min(1),
    total: z.string().min(1),
    items: z.array(
      z.object({
        name: z.string().min(1),
        qty: z.number().int().positive(),
        unitPrice: z.string().min(1),
        total: z.string().min(1),
      })
    ),
    footer: z.string().optional(),
  }),
  openCashDrawer: z.boolean().optional(),
  cut: z.boolean().optional(),
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "print-bridge" });
});

app.get("/printers", async (_req, res) => {
  const lanIp = process.env.PRINTER_LAN_IP;
  const lanPort = process.env.PRINTER_LAN_PORT || "9100";
  const printerHostname = process.env.PRINTER_HOSTNAME;
  
  const printers: any[] = [];
  
  // Add LAN printer if configured via IP
  if (lanIp) {
    printers.push({
      name: `LAN: ${lanIp}:${lanPort}`,
      type: "LAN",
      ip: lanIp,
      port: parseInt(lanPort),
    });
  }
  
  // Try auto-discovery if hostname is configured
  if (printerHostname && !lanIp) {
    try {
      const discovered = await PrinterDiscovery.resolveByHostname(printerHostname);
      if (discovered) {
        printers.push({
          name: `LAN: ${discovered.hostname || discovered.ip}:${discovered.port}`,
          type: "LAN",
          ip: discovered.ip,
          port: discovered.port,
          hostname: discovered.hostname,
        });
      }
    } catch (e: any) {
      console.warn("Failed to resolve printer hostname:", e.message);
    }
  }
  
  // Add USB printers if module is available (lazy load)
  await loadUsbModule();
  if (listPrinters && usbModuleLoaded) {
    try {
      const usbPrinters = useLpFallback 
        ? await listPrinters() 
        : listPrinters();
      printers.push(...usbPrinters.map((p: any) => ({
        ...p,
        type: "USB",
      })));
    } catch (e: any) {
      console.warn("Failed to list USB printers:", e.message);
    }
  }
  
  return res.json({ printers });
});

// Auto-discovery endpoint
app.get("/discover", async (_req, res) => {
  try {
    const discovered = await PrinterDiscovery.autoDiscover();
    if (discovered) {
      return res.json({ success: true, printer: discovered });
    }
    return res.json({ success: false, message: "No printer found" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/print", async (req, res) => {
  const parsed = PrintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      detail: "INVALID_PAYLOAD",
      issues: parsed.error.issues,
    });
  }

  const body = parsed.data as PrintRequest;

  const data = buildReceipt(body.receipt, {
    cut: body.cut ?? true,
    openDrawer: body.openCashDrawer ?? false,
  });

  // Try to get IP from multiple sources
  let lanIp = body.lan?.ip ?? process.env.PRINTER_LAN_IP;
  const printerHostname = process.env.PRINTER_HOSTNAME;
  
  // If no IP but hostname is configured, try to resolve it
  if (!lanIp && printerHostname) {
    try {
      const discovered = await PrinterDiscovery.resolveByHostname(printerHostname);
      if (discovered) {
        lanIp = discovered.ip;
        console.log(`Resolved printer hostname ${printerHostname} -> ${lanIp}`);
      }
    } catch (e: any) {
      console.warn("Failed to resolve printer hostname:", e.message);
    }
  }
  
  const lanPort = body.lan?.port ?? Number(process.env.PRINTER_LAN_PORT ?? "9100");
  const usbName = body.usb?.printerName ?? process.env.PRINTER_USB_NAME;

  try {
    if (body.mode === "LAN") {
      if (!lanIp) {
        return res.status(400).json({ detail: "LAN_IP_REQUIRED" });
      }
      await sendToLan(lanIp, lanPort, data);
      return res.json({ ok: true, used: "LAN" });
    }

    if (body.mode === "USB") {
      await loadUsbModule();
      if (!usbName) {
        return res.status(400).json({
          detail: "USB_PRINTER_NAME_REQUIRED",
          hint: "Call GET /printers to find the printer name, then set usb.printerName or PRINTER_USB_NAME.",
        });
      }
      if (!sendToUsbRaw) {
        return res.status(503).json({
          detail: "USB_MODULE_NOT_AVAILABLE",
          hint: "USB printing module is not available. Use LAN mode or install USB module.",
        });
      }
      await sendToUsbRaw(data, { printerName: usbName });
      return res.json({ ok: true, used: "USB" });
    }

    // AUTO mode: try LAN first, then USB fallback
    if (lanIp) {
      try {
        await sendToLan(lanIp, lanPort, data);
        return res.json({ ok: true, used: "LAN" });
      } catch (error) {
        console.error("LAN print failed, trying USB fallback:", error);
        // Fall through to USB
      }
    }

    // USB fallback (only if module is available)
    await loadUsbModule();
    if (!sendToUsbRaw) {
      return res.status(503).json({
        detail: "LAN_FAILED_AND_USB_NOT_AVAILABLE",
        hint: "LAN failed and USB printing module is not available. Check LAN printer connection or install USB module.",
      });
    }
    
    if (!usbName) {
      return res.status(503).json({
        detail: "LAN_FAILED_AND_USB_PRINTER_NOT_SET",
        hint: "LAN failed. Call GET /printers to find the printer name, then set usb.printerName or PRINTER_USB_NAME.",
      });
    }

    try {
      await sendToUsbRaw(data, { printerName: usbName });
      return res.json({ ok: true, used: "USB" });
    } catch (usbError: any) {
      console.error("USB print also failed:", usbError);
      return res.status(500).json({
        detail: "BOTH_LAN_AND_USB_FAILED",
        error: usbError.message,
        hint: "Check printer connection and name.",
      });
    }
  } catch (e: any) {
    console.error("Print error:", e);
    return res.status(500).json({
      detail: "PRINT_FAILED",
      error: e.message,
    });
  }
});

const PORT = Number(process.env.PORT ?? "3333");
const LAN_IP = process.env.PRINTER_LAN_IP;
const PRINTER_HOSTNAME = process.env.PRINTER_HOSTNAME;
const LAN_PORT = Number(process.env.PRINTER_LAN_PORT ?? "9100");

// Auto-discover printer on startup if no IP configured
let autoDiscoveredPrinter: any = null;
if (!LAN_IP && PRINTER_HOSTNAME) {
  PrinterDiscovery.resolveByHostname(PRINTER_HOSTNAME)
    .then((printer) => {
      if (printer) {
        autoDiscoveredPrinter = printer;
        console.log(`✅ Auto-discovered printer: ${printer.hostname} -> ${printer.ip}`);
      }
    })
    .catch(() => {});
} else if (!LAN_IP && !PRINTER_HOSTNAME) {
  // Try full auto-discovery
  PrinterDiscovery.autoDiscover()
    .then((printer) => {
      if (printer) {
        autoDiscoveredPrinter = printer;
        console.log(`✅ Auto-discovered printer: ${printer.ip}:${printer.port}`);
      }
    })
    .catch(() => {});
}

app.listen(PORT, () => {
  console.log(`Print Bridge running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Printers endpoint: http://localhost:${PORT}/printers`);
  console.log(`Auto-discovery endpoint: http://localhost:${PORT}/discover`);
  
  if (LAN_IP) {
    console.log(`📡 LAN Printer configured (IP): ${LAN_IP}:${LAN_PORT}`);
  } else if (PRINTER_HOSTNAME) {
    console.log(`📡 LAN Printer configured (hostname): ${PRINTER_HOSTNAME}`);
    console.log(`   Will auto-resolve IP on each print job`);
  } else if (autoDiscoveredPrinter) {
    console.log(`📡 LAN Printer auto-discovered: ${autoDiscoveredPrinter.ip}:${autoDiscoveredPrinter.port}`);
  } else {
    console.log(`⚠️  No LAN printer configured. Options:`);
    console.log(`   - Set PRINTER_LAN_IP environment variable`);
    console.log(`   - Set PRINTER_HOSTNAME (e.g., "printer.local")`);
    console.log(`   - Use /discover endpoint for auto-discovery`);
  }
});

