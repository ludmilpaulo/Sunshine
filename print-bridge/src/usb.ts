// Cross-platform USB printing via OS spooler (Windows/Linux/Mac)
import printer from "printer";

export type UsbPrintOptions = {
  printerName: string; // required for USB spooler printing
};

/**
 * Normalize printer name for Windows compatibility
 * Windows sometimes requires exact name matching or specific formats
 */
function normalizePrinterName(name: string): string[] {
  const variations: string[] = [name];
  
  // On Windows, try different variations
  if (process.platform === "win32") {
    // Try exact name
    variations.push(name);
    // Try without any trailing spaces
    variations.push(name.trim());
    // Try with different case (sometimes Windows is case-sensitive)
    variations.push(name.toUpperCase());
    variations.push(name.toLowerCase());
  }
  
  // Remove duplicates while preserving order
  return Array.from(new Set(variations));
}

/**
 * Attempt to print using multiple printer name variations
 * This helps with Windows 10 compatibility issues
 */
async function tryPrintWithVariations(
  data: Buffer,
  printerName: string
): Promise<void> {
  const nameVariations = normalizePrinterName(printerName);
  const errors: string[] = [];
  
  for (const name of nameVariations) {
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          printer.printDirect({
            data,
            printer: name,
            type: "RAW",
            success: () => resolve(),
            error: (err: Error) => reject(err),
          });
        } catch (e: any) {
          reject(new Error(`USB print failed: ${e.message || String(e)}`));
        }
      });
      // Success! Log which variation worked
      if (name !== printerName) {
        console.log(`✅ Print succeeded with name variation: "${name}" (original: "${printerName}")`);
      }
      return; // Success, exit early
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      errors.push(`"${name}": ${errorMsg}`);
      // Continue to next variation
    }
  }
  
  // If we get here, all variations failed
  // Try default printer as last resort (Windows)
  if (process.platform === "win32") {
    try {
      const defaultName = getDefaultPrinterName();
      if (defaultName && defaultName !== printerName) {
        console.log(`⚠️  Trying default printer as fallback: "${defaultName}"`);
        await new Promise<void>((resolve, reject) => {
          try {
            printer.printDirect({
              data,
              printer: defaultName,
              type: "RAW",
              success: () => resolve(),
              error: (err: Error) => reject(err),
            });
          } catch (e: any) {
            reject(new Error(`USB print failed: ${e.message || String(e)}`));
          }
        });
        console.log(`✅ Print succeeded using default printer: "${defaultName}"`);
        return; // Success with default printer
      }
    } catch (defaultError: any) {
      errors.push(`Default printer: ${defaultError.message || String(defaultError)}`);
    }
  }
  
  // All attempts failed
  throw new Error(
    `USB print failed with all name variations. Errors:\n${errors.join("\n")}\n\n` +
    `Troubleshooting:\n` +
    `1. Verify printer name: Call GET /printers to see available printers\n` +
    `2. Check printer is online: Windows Settings → Devices → Printers\n` +
    `3. Test print from Windows: Print a test page from the OS\n` +
    `4. Try setting printer as default: Right-click printer → Set as default\n` +
    `5. Check printer driver: Ensure driver is properly installed`
  );
}

export async function sendToUsbRaw(data: Buffer, opts: UsbPrintOptions): Promise<void> {
  try {
    // First, verify the printer exists in the system
    const availablePrinters = listPrinters();
    const printerExists = availablePrinters.some(
      (p) => p.name === opts.printerName || p.name.trim() === opts.printerName.trim()
    );
    
    if (!printerExists) {
      const printerNames = availablePrinters.map((p) => `"${p.name}"`).join(", ");
      throw new Error(
        `Printer "${opts.printerName}" not found in system.\n` +
        `Available printers: ${printerNames || "none"}\n` +
        `Call GET /printers to see all available printers.`
      );
    }
    
    // Try printing with name variations
    await tryPrintWithVariations(data, opts.printerName);
  } catch (e: any) {
    // Re-throw with enhanced error message
    throw new Error(`USB print failed: ${e.message || String(e)}`);
  }
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

