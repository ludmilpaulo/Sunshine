// Cross-platform USB printing via OS spooler (Windows/Linux/Mac)
import printer from "printer";

export type UsbPrintOptions = {
  printerName: string; // required for USB spooler printing
};

export async function sendToUsbRaw(data: Buffer, opts: UsbPrintOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      printer.printDirect({
        data, // raw ESC/POS bytes
        printer: opts.printerName,
        type: "RAW",
        success: () => resolve(),
        error: (err: Error) => reject(err),
      });
    } catch (e: any) {
      reject(new Error(`USB print failed: ${e.message || String(e)}`));
    }
  });
}

export function listPrinters(): { name: string; status?: number; isDefault?: boolean }[] {
  try {
    const printers = printer.getPrinters();
    const defaultName = (printer as any).getDefaultPrinterName?.() ?? undefined;

    return printers.map((p: any) => ({
      name: String(p.name),
      status: typeof p.status === "number" ? p.status : undefined,
      isDefault: defaultName ? String(p.name) === defaultName : undefined,
    }));
  } catch (e: any) {
    console.error("Failed to list printers:", e);
    return [];
  }
}

export function getDefaultPrinterName(): string | null {
  try {
    const defaultName = (printer as any).getDefaultPrinterName?.();
    return defaultName ? String(defaultName) : null;
  } catch {
    return null;
  }
}

