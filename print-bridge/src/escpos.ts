import { ReceiptPayload } from "./types.js";

const ESC = 0x1b;
const GS = 0x1d;

function txt(s: string): Buffer {
  return Buffer.from(s, "utf8");
}

function lf(lines = 1): Buffer {
  return Buffer.from("\n".repeat(lines), "ascii");
}

function init(): Buffer {
  return Buffer.from([ESC, 0x40]); // ESC @
}

function align(n: 0 | 1 | 2): Buffer {
  return Buffer.from([ESC, 0x61, n]); // ESC a n
}

function bold(on: boolean): Buffer {
  return Buffer.from([ESC, 0x45, on ? 1 : 0]);
}

function size(w: 0 | 1, h: 0 | 1): Buffer {
  // GS ! n  (rough sizing)
  const n = (w ? 0x20 : 0x00) | (h ? 0x10 : 0x00);
  return Buffer.from([GS, 0x21, n]);
}

function cut(): Buffer {
  return Buffer.from([GS, 0x56, 0x01]); // partial cut
}

function openDrawer(): Buffer {
  // ESC p m t1 t2 (kick drawer)
  return Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa]);
}

function line(columns = 42): Buffer {
  return txt("-".repeat(columns) + "\n");
}

function formatItem(name: string, qty: number, total: string, cols = 42): string {
  const left = `${qty}x ${name}`.slice(0, cols - (total.length + 1));
  const spaces = " ".repeat(Math.max(1, cols - left.length - total.length));
  return `${left}${spaces}${total}\n`;
}

function doubleLine(columns = 42): Buffer {
  return txt("=".repeat(columns) + "\n");
}

export function buildReceipt(
  p: ReceiptPayload,
  opts: { cut: boolean; openDrawer: boolean }
): Buffer {
  const parts: Buffer[] = [];
  const cols = 48; // Wider receipt

  // Initialize printer
  parts.push(init());
  
  // Header - Professional design
  parts.push(align(1)); // Center align
  parts.push(bold(true), size(1, 1)); // Large and bold
  parts.push(txt(p.shopName + "\n"));
  parts.push(size(0, 0), bold(false)); // Reset size
  
  if (p.shopAddress) {
    parts.push(txt(p.shopAddress + "\n"));
  }
  if (p.shopPhone) {
    parts.push(txt(`Tel: ${p.shopPhone}\n`));
  }
  
  parts.push(lf(1));
  parts.push(doubleLine(cols));
  parts.push(lf(1));
  
  // Sale information
  parts.push(align(0)); // Left align
  parts.push(bold(true));
  parts.push(txt("RECIBO DE VENDA\n"));
  parts.push(bold(false));
  parts.push(line(cols));
  
  const saleDate = new Date(p.date);
  const dateStr = saleDate.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = saleDate.toLocaleTimeString("pt-AO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  parts.push(txt(`Venda:     ${p.saleNumber}\n`));
  parts.push(txt(`Data:      ${dateStr}\n`));
  parts.push(txt(`Hora:      ${timeStr}\n`));
  parts.push(line(cols));
  parts.push(lf(1));
  
  // Items header
  parts.push(bold(true));
  parts.push(txt("ITEM".padEnd(25) + "QTD".padStart(6) + "TOTAL".padStart(12) + "\n"));
  parts.push(bold(false));
  parts.push(line(cols));
  
  // Items
  for (const it of p.items) {
    const name = it.name.length > 25 ? it.name.substring(0, 22) + "..." : it.name;
    const qty = it.qty.toString().padStart(6);
    const total = parseFloat(it.total).toFixed(2).padStart(12);
    parts.push(txt(`${name.padEnd(25)}${qty}${total}\n`));
    
    // Show unit price if quantity > 1
    if (it.qty > 1) {
      const unitPrice = (parseFloat(it.total) / it.qty).toFixed(2);
      parts.push(txt(`  @ ${unitPrice} cada`.padStart(cols) + "\n"));
    }
  }
  
  parts.push(lf(1));
  parts.push(doubleLine(cols));
  
  // Totals - Professional formatting
  parts.push(lf(1));
  const subtotal = parseFloat(p.subtotal).toFixed(2);
  const tax = parseFloat(p.tax).toFixed(2);
  const total = parseFloat(p.total).toFixed(2);
  
  parts.push(txt("SUBTOTAL:".padEnd(35) + subtotal.padStart(13) + "\n"));
  parts.push(txt("IMPOSTO:".padEnd(35) + tax.padStart(13) + "\n"));
  parts.push(bold(true));
  parts.push(doubleLine(cols));
  parts.push(txt("TOTAL:".padEnd(35) + total.padStart(13) + "\n"));
  parts.push(bold(false));
  parts.push(doubleLine(cols));
  
  parts.push(lf(2));
  
  // Footer
  if (p.footer) {
    parts.push(align(1));
    parts.push(txt(p.footer + "\n"));
    parts.push(align(0));
  }
  
  parts.push(lf(2));
  parts.push(align(1));
  parts.push(txt("Obrigado pela sua preferência!\n"));
  parts.push(txt("Volte sempre!\n"));
  parts.push(align(0));
  parts.push(lf(2));
  
  // Drawer and cut
  if (opts.openDrawer) parts.push(openDrawer());
  if (opts.cut) parts.push(cut());
  
  parts.push(lf(3));
  return Buffer.concat(parts);
}

