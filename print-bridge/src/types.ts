export type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: string;
  total: string;
};

export type ReceiptPayload = {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  saleNumber: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  items: ReceiptItem[];
  footer?: string;
};

export type PrintRequest = {
  mode: "LAN" | "USB" | "AUTO";
  lan?: { ip: string; port?: number };
  usb?: { printerName: string }; // Cross-platform USB queue name
  receipt: ReceiptPayload;
  openCashDrawer?: boolean;
  cut?: boolean;
};

