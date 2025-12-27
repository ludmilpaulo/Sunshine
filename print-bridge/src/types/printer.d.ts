// Type definitions for the 'printer' package
declare module "printer" {
  interface Printer {
    name: string;
    status?: number;
    isDefault?: boolean;
  }

  interface PrintDirectOptions {
    data: Buffer | string;
    printer: string;
    type: "RAW" | "TEXT" | "PDF" | "POSTSCRIPT" | "IMAGE";
    success?: (jobID: string) => void;
    error?: (err: Error) => void;
  }

  export function getPrinters(): Printer[];
  export function getDefaultPrinterName(): string | null;
  export function printDirect(options: PrintDirectOptions): void;
}

