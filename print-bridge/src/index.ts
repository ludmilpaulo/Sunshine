import express from "express";
import cors from "cors";
import { z } from "zod";
import { buildReceipt } from "./escpos.js";
import { sendToLan } from "./lan.js";
import { sendToUsbRaw, listPrinters } from "./usb.js";
import type { PrintRequest } from "./types.js";

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

app.get("/printers", (_req, res) => {
  try {
    const printers = listPrinters();
    return res.json({ printers });
  } catch (e: any) {
    console.error("Failed to list printers:", e);
    return res.status(500).json({
      detail: "PRINTER_ENUM_FAILED",
      error: e.message,
    });
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

  const lanIp = body.lan?.ip ?? process.env.PRINTER_LAN_IP;
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
      if (!usbName) {
        return res.status(400).json({
          detail: "USB_PRINTER_NAME_REQUIRED",
          hint: "Call GET /printers to find the printer name, then set usb.printerName or PRINTER_USB_NAME.",
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

    // USB fallback
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
app.listen(PORT, () => {
  console.log(`Print Bridge running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

