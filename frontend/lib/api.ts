import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://sunshinebar.pythonanywhere.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't retry login endpoint - let it fail with specific error message
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login/')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem("access_token", access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface Product {
  id: number;
  name: string;
  barcode: string;
  sku: string;
  price: string;
  cost: string;
  tax_rate: string;
  active: boolean;
  inventory?: {
    qty_on_hand: number;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  unit_price: string;
}

export interface CheckoutItem {
  barcode: string;
  qty: number;
  unit_price: string;
}

export interface CheckoutPayment {
  method: "CASH" | "CARD" | "TRANSFER";
  amount: string;
  reference?: string;
}

export interface ReceiptPayload {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  saleNumber: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: string;
    total: string;
  }>;
  footer?: string;
}

export interface CheckoutResponse {
  saleId: number;
  saleNumber: string;
  receipt: ReceiptPayload;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  role: "admin" | "manager" | "staff";
  operation_type: "SHOP" | "SALON" | "STUDIO" | "BOTH";
  date_joined: string;
  last_login?: string;
}

export interface DashboardStats {
  sales: {
    today_revenue: number;
    today_count: number;
    month_revenue: number;
    month_count: number;
    last_month_revenue: number;
    revenue_growth: number;
  };
  products: {
    total: number;
    active: number;
    low_stock: number;
  };
  recent_sales: Array<{
    id: number;
    number: string;
    total: number;
    cashier: string;
    created_at: string;
  }>;
}

// Auth
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      username,
      password,
    });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    return { access, refresh };
  },
  logout: () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
  },
  getMe: async () => {
    const response = await api.get("/auth/me/");
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/auth/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  requestPasswordReset: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/password-reset/request/`, {
      email,
    });
    return response.data;
  },
  confirmPasswordReset: async (uid: string, token: string, newPassword: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/password-reset/confirm/`, {
      uid,
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Products
export const productsApi = {
  list: async (search?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (page) params.append("page", page.toString());
    const response = await api.get(`/products/?${params.toString()}`);
    return response.data;
  },
  getByBarcode: async (barcode: string): Promise<Product> => {
    // Encode barcode to handle special characters
    const encodedBarcode = encodeURIComponent(barcode);
    const response = await api.get(`/products/by-barcode/${encodedBarcode}/`);
    return response.data;
  },
  create: async (data: Partial<Product>) => {
    const response = await api.post("/products/", data);
    return response.data;
  },
  update: async (id: number, data: Partial<Product>) => {
    const response = await api.patch(`/products/${id}/`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/products/${id}/`);
  },
};

// Sales
export const salesApi = {
  checkout: async (items: CheckoutItem[], payments: CheckoutPayment[], operationType?: "SHOP" | "SALON" | "STUDIO"): Promise<CheckoutResponse> => {
    const response = await api.post("/sales/checkout/", { items, payments, operation_type: operationType });
    return response.data;
  },
  list: async (dateFrom?: string, dateTo?: string, page?: number) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (page) params.append("page", page.toString());
    const response = await api.get(`/sales/?${params.toString()}`);
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get(`/sales/${id}/`);
    return response.data;
  },
};

// Stock
export const stockApi = {
  adjust: async (productId: number, qtyChange: number, reason: string, notes?: string) => {
    const response = await api.post("/stock/adjust/", {
      product_id: productId,
      qty_change: qtyChange,
      reason,
      notes,
    });
    return response.data;
  },
};

// Print
// Helper function to get Print Bridge URL based on environment
const getPrintBridgeUrl = (): string | null => {
  // Priority 1: Use environment variable if set (for cloud-deployed Print Bridge)
  if (process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL) {
    return process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL;
  }
  
  // Priority 2: Always try localhost:3333 first
  // This works because:
  // - The frontend code runs in the browser (client-side)
  // - If Print Bridge is running on the client's machine, localhost:3333 will work
  // - This is the most common scenario: Print Bridge runs locally on the cashier PC
  // - Even if frontend is deployed on Vercel, it can still connect to localhost on the client machine
  
  if (typeof window !== "undefined") {
    console.log("🔍 Print Bridge: Trying localhost:3333 (Print Bridge should run on client machine)");
    console.log("   Frontend hostname:", window.location.hostname);
    console.log("   Note: Print Bridge must be running on the same machine as the browser");
  }
  
  return "http://localhost:3333";
};

export const printApi = {
  checkHealth: async () => {
    const printBridgeUrl = getPrintBridgeUrl();
    if (!printBridgeUrl) {
      return { ok: false, error: "PRINT_BRIDGE_NOT_CONFIGURED" };
    }
    try {
      const response = await fetch(`${printBridgeUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      if (response.ok) {
        return { ok: true };
      }
      return { ok: false, error: "PRINT_BRIDGE_NOT_RESPONDING" };
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "Failed to fetch") {
        return { ok: false, error: "PRINT_BRIDGE_NOT_RUNNING" };
      }
      return { ok: false, error: "PRINT_BRIDGE_ERROR" };
    }
  },
  listPrinters: async () => {
    const printBridgeUrl = getPrintBridgeUrl();
    if (!printBridgeUrl) {
      throw new Error("Print Bridge URL não configurado. Configure NEXT_PUBLIC_PRINT_BRIDGE_URL.");
    }
    const response = await fetch(`${printBridgeUrl}/printers`);
    if (!response.ok) {
      throw new Error("Failed to list printers");
    }
    return response.json();
  },
  printReceipt: async (
    receipt: ReceiptPayload,
    printerConfig?: {
      mode?: "LAN" | "USB" | "AUTO";
      lanIp?: string;
      lanPort?: number;
      usbPrinterName?: string;
    }
  ) => {
    const printBridgeUrl = getPrintBridgeUrl();
    
    // If Print Bridge URL is not configured, skip printing gracefully
    if (!printBridgeUrl) {
      console.warn("⚠️ Print Bridge não configurado. Impressão será ignorada.");
      throw new Error("PRINT_BRIDGE_NOT_CONFIGURED");
    }
    
    // Get printer config from env or use provided
    const lanIp = printerConfig?.lanIp || process.env.NEXT_PUBLIC_PRINTER_LAN_IP;
    // Default USB printer name if not provided - use from Print Bridge .env or default
    const usbName = printerConfig?.usbPrinterName || process.env.NEXT_PUBLIC_PRINTER_USB_NAME || "_USB_Receipt_Printer";
    
    try {
      const response = await fetch(`${printBridgeUrl}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: printerConfig?.mode || "AUTO",
          lan: lanIp
            ? {
                ip: lanIp,
                port: printerConfig?.lanPort || 9100,
              }
            : undefined,
          // Always send USB config to ensure fallback works
          usb: {
            printerName: usbName,
          },
          receipt,
          cut: true,
          openCashDrawer: false,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errorMessage = body?.detail || body?.error || `HTTP ${response.status}`;
        throw new Error(`Falha na impressão: ${errorMessage}`);
      }

      return response.json();
    } catch (error: any) {
      // Check if it's a network error (Print Bridge not running)
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        // More specific error message for production
        const isLocalhost = printBridgeUrl?.includes("localhost") || printBridgeUrl?.includes("127.0.0.1");
        if (isLocalhost) {
          throw new Error(
            `PRINT_BRIDGE_NOT_RUNNING: Print Bridge não está rodando na máquina atual. ` +
            `Execute na máquina do caixa: cd print-bridge && npm start`
          );
        } else {
          throw new Error(
            `PRINT_BRIDGE_NOT_ACCESSIBLE: Print Bridge não está acessível em ${printBridgeUrl}. ` +
            `Verifique se o serviço está rodando.`
          );
        }
      }
      // Check for CORS errors
      if (error.message?.includes("CORS") || error.message?.includes("blocked")) {
        throw new Error(
          `Erro de CORS ao conectar ao Print Bridge. ` +
          `Verifique se o Print Bridge está configurado para aceitar requisições de ${window.location.origin}`
        );
      }
      throw error;
    }
  },
  printReceiptBrowser: async (receipt: ReceiptPayload) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error("Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão habilitados.");
    }

    // Generate HTML for receipt
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recibo ${receipt.saleNumber}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }
      body {
        margin: 0;
        padding: 2mm 4mm 2mm 4mm;
      }
      .no-print {
        display: none;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 2mm 4mm;
      color: #1a1a1a;
      background: #ffffff;
    }
    .receipt {
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid #1a1a1a;
    }
    .shop-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      text-transform: uppercase;
      color: #1a1a1a;
    }
    .shop-info {
      font-size: 9px;
      margin: 2px 0;
      color: #4a4a4a;
      line-height: 1.3;
    }
    .sale-info {
      margin: 6px 0;
      padding: 5px 0;
      background: #f8f8f8;
      border-radius: 3px;
    }
    .sale-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 3px 8px;
      font-size: 10px;
      font-weight: 500;
    }
    .sale-info-label {
      color: #666;
      font-weight: 500;
    }
    .sale-info-value {
      color: #1a1a1a;
      font-weight: 600;
    }
    .divider {
      border: none;
      border-top: 1px dashed #999;
      margin: 6px 0;
    }
    .section-title {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      margin: 5px 0 4px 0;
      letter-spacing: 0.5px;
    }
    .items {
      margin: 4px 0;
    }
    .item {
      margin: 6px 0;
      padding: 4px 0;
      border-bottom: 1px dotted #ddd;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 600;
      font-size: 11px;
      margin-bottom: 2px;
      color: #1a1a1a;
      line-height: 1.3;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      margin-top: 2px;
      padding-left: 4px;
    }
    .item-qty-price {
      color: #666;
      font-weight: 500;
    }
    .item-total {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 10px;
    }
    .totals {
      margin: 8px 0;
      padding-top: 6px;
      border-top: 2px solid #1a1a1a;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 4px 0;
      font-size: 11px;
      padding: 1px 0;
    }
    .total-label {
      font-weight: 500;
      color: #4a4a4a;
    }
    .total-value {
      font-weight: 600;
      color: #1a1a1a;
    }
    .total-row.total {
      font-size: 14px;
      font-weight: 700;
      border-top: 2px solid #1a1a1a;
      padding-top: 4px;
      margin-top: 4px;
      color: #1a1a1a;
    }
    .total-row.total .total-label {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-row.total .total-value {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #999;
      font-size: 9px;
      color: #666;
      line-height: 1.5;
    }
    .footer-custom {
      margin-bottom: 5px;
      font-weight: 500;
      color: #4a4a4a;
    }
    .footer-thanks {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 10px;
      margin-top: 4px;
    }
    .divider-line {
      border: none;
      border-top: 1px dashed #999;
      margin: 6px 0;
    }
    .divider-thick {
      border: none;
      border-top: 2px solid #1a1a1a;
      margin: 6px 0;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="shop-name">${receipt.shopName}</div>
      ${receipt.shopAddress ? `<div class="shop-info">${receipt.shopAddress}</div>` : ''}
      ${receipt.shopPhone ? `<div class="shop-info">📞 ${receipt.shopPhone}</div>` : ''}
    </div>
    
    <div class="sale-info">
      <div class="sale-info-row">
        <span class="sale-info-label">Venda Nº:</span>
        <span class="sale-info-value">${receipt.saleNumber}</span>
      </div>
      <div class="sale-info-row">
        <span class="sale-info-label">Data:</span>
        <span class="sale-info-value">${receipt.date}</span>
      </div>
    </div>
    
    <hr class="divider-thick">
    
    <div class="section-title">Itens</div>
    <div class="items">
      ${receipt.items.map(item => `
        <div class="item">
          <div class="item-name">${item.name}</div>
          <div class="item-details">
            <span class="item-qty-price">${item.qty} × ${parseFloat(item.unitPrice).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
            <span class="item-total">${parseFloat(item.total).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <hr class="divider-thick">
    
    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${parseFloat(receipt.subtotal).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
      </div>
      <div class="total-row">
        <span class="total-label">Taxa</span>
        <span class="total-value">${parseFloat(receipt.tax).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
      </div>
      <div class="total-row total">
        <span class="total-label">Total</span>
        <span class="total-value">${parseFloat(receipt.total).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz</span>
      </div>
    </div>
    
    <div class="footer">
      ${receipt.footer ? `<div class="footer-custom">${receipt.footer}</div>` : ''}
      <div class="footer-thanks">Obrigado pela sua preferência!</div>
      <div style="margin-top: 6px; font-size: 8px;">Volte sempre!</div>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
      // Close window after printing (with delay to allow print dialog to open)
      setTimeout(function() {
        window.close();
      }, 250);
    };
  </script>
</body>
</html>
    `;

    // Write HTML to print window
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Return success (printing happens asynchronously via window.print())
    return { success: true };
  },
};

// Users
export const usersApi = {
  list: async (role?: string, search?: string, page?: number) => {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (search) params.append("search", search);
    if (page) params.append("page", page.toString());
    const response = await api.get(`/users/?${params.toString()}`);
    return response.data;
  },
  get: async (id: number) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
    create: async (data: Partial<User> & { password: string; role: "admin" | "manager" | "staff"; operation_type?: "SHOP" | "SALON" | "STUDIO" | "BOTH" }) => {
      const response = await api.post("/users/", data);
      return response.data;
    },
    update: async (id: number, data: Partial<User> & { password?: string; operation_type?: "SHOP" | "SALON" | "STUDIO" | "BOTH" }) => {
      const response = await api.patch(`/users/${id}/`, data);
      return response.data;
    },
  delete: async (id: number) => {
    await api.delete(`/users/${id}/`);
  },
  getStats: async () => {
    const response = await api.get("/users/stats/");
    return response.data;
  },
};

// Dashboard
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats/");
    return response.data;
  },
  getSalesChart: async () => {
    const response = await api.get("/dashboard/sales-chart/");
    return response.data;
  },
  getTopProducts: async () => {
    const response = await api.get("/dashboard/top-products/");
    return response.data;
  },
};

// Analytics
export interface SalesByUserResponse {
  period: string;
  date_from: string | null;
  date_to: string | null;
  users: Array<{
    user_id: number;
    username: string;
    full_name: string;
    total_revenue: number;
    total_sales: number;
    avg_sale: number;
  }>;
  summary: {
    total_revenue: number;
    total_sales: number;
    user_count: number;
  };
}

export interface TopSellersResponse {
  period: string;
  top_sellers: Array<{
    rank: number;
    user_id: number;
    username: string;
    full_name: string;
    total_revenue: number;
    total_sales: number;
  }>;
}

export interface SalesByUserWithTaxResponse {
  period: string;
  date_from: string | null;
  date_to: string | null;
  users: Array<{
    user_id: number;
    username: string;
    full_name: string;
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    total_sales: number;
    avg_sale: number;
    tax_percentage: number;
  }>;
  summary: {
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    total_sales: number;
    user_count: number;
    tax_percentage: number;
  };
}

export interface SalesByPaymentMethodResponse {
  period: string;
  date_from: string | null;
  date_to: string | null;
  payment_methods: Array<{
    method: string;
    method_display: string;
    total_amount: number;
    count: number;
    percentage: number;
  }>;
  summary: {
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    tax_percentage: number;
  };
}

export const analyticsApi = {
  getSalesByUser: async (params?: {
    period?: "day" | "week" | "month";
    date_from?: string;
    date_to?: string;
    user_id?: number;
    operation_type?: "SHOP" | "SALON" | "STUDIO";
  }): Promise<SalesByUserResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);
    if (params?.user_id) queryParams.append("user_id", params.user_id.toString());
    if (params?.operation_type) queryParams.append("operation_type", params.operation_type);
    const response = await api.get(`/analytics/sales-by-user/?${queryParams.toString()}`);
    return response.data;
  },
  getSalesByUserWithTax: async (params?: {
    period?: "day" | "week" | "month";
    date_from?: string;
    date_to?: string;
    user_id?: number;
    operation_type?: "SHOP" | "SALON" | "STUDIO";
  }): Promise<SalesByUserWithTaxResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);
    if (params?.user_id) queryParams.append("user_id", params.user_id.toString());
    if (params?.operation_type) queryParams.append("operation_type", params.operation_type);
    const response = await api.get(`/analytics/sales-by-user-with-tax/?${queryParams.toString()}`);
    return response.data;
  },
  getSalesByPaymentMethod: async (params?: {
    period?: "day" | "week" | "month";
    date_from?: string;
    date_to?: string;
    operation_type?: "SHOP" | "SALON" | "STUDIO";
  }): Promise<SalesByPaymentMethodResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.date_from) queryParams.append("date_from", params.date_from);
    if (params?.date_to) queryParams.append("date_to", params.date_to);
    if (params?.operation_type) queryParams.append("operation_type", params.operation_type);
    const response = await api.get(`/analytics/sales-by-payment-method/?${queryParams.toString()}`);
    return response.data;
  },
  getSalesTrendByUser: async (params?: {
    period?: "day" | "week" | "month";
    days?: number;
    user_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.days) queryParams.append("days", params.days.toString());
    if (params?.user_id) queryParams.append("user_id", params.user_id.toString());
    const response = await api.get(`/analytics/sales-trend-by-user/?${queryParams.toString()}`);
    return response.data;
  },
  getTopSellers: async (params?: {
    period?: "day" | "week" | "month";
    limit?: number;
  }): Promise<TopSellersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const response = await api.get(`/analytics/top-sellers/?${queryParams.toString()}`);
    return response.data;
  },
};

export default api;

