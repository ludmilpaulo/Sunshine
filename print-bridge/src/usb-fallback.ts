// Fallback USB printing using system lp command (when native module fails)
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

export async function sendToUsbViaLp(
  data: Buffer,
  printerName: string
): Promise<void> {
  const tempFile = path.join(os.tmpdir(), `receipt-${Date.now()}.raw`);
  
  try {
    // Write data to temporary file
    await writeFile(tempFile, data);
    
    // Print using lp command with raw option
    const command = `lp -d "${printerName}" -o raw "${tempFile}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      // Clean up temp file
      try {
        await unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (stderr && !stderr.includes("request id is")) {
        // lp sometimes outputs to stderr even on success
        // "request id is" indicates success
        throw new Error(`lp command failed: ${stderr}`);
      }
    } catch (execError: any) {
      // Clean up temp file on error
      try {
        await unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      throw new Error(`lp command failed: ${execError.message || String(execError)}`);
    }
  } catch (e: any) {
    throw new Error(`USB print via lp failed: ${e.message || String(e)}`);
  }
}

export async function listPrintersViaLp(): Promise<
  { name: string; status?: number; isDefault?: boolean }[]
> {
  try {
    const { stdout } = await execAsync("lpstat -p -d");
    const lines = stdout.split("\n").filter((line) => line.trim());
    
    const printers: { name: string; status?: number; isDefault?: boolean }[] = [];
    let currentPrinter: string | null = null;
    let isDefault = false;
    
    // Parse lpstat output
    for (const line of lines) {
      if (line.includes("system default destination:")) {
        const defaultName = line.split(":").pop()?.trim();
        if (defaultName) {
          isDefault = true;
        }
      } else if (line.startsWith("printer ")) {
        const match = line.match(/printer\s+(\S+)/);
        if (match) {
          currentPrinter = match[1];
          printers.push({
            name: currentPrinter,
            isDefault: false, // Will be set below if needed
          });
        }
      }
    }
    
    // Mark default printer
    if (isDefault) {
      const defaultName = stdout
        .split("system default destination:")[1]
        ?.split("\n")[0]
        ?.trim();
      if (defaultName) {
        const defaultPrinter = printers.find((p) => p.name === defaultName);
        if (defaultPrinter) {
          defaultPrinter.isDefault = true;
        }
      }
    }
    
    return printers;
  } catch (e: any) {
    console.error("Failed to list printers via lp:", e.message);
    return [];
  }
}

