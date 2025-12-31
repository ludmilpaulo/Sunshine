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
export const printApi = {
  listPrinters: async () => {
    const printBridgeUrl = process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL || "http://localhost:3333";
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
    const printBridgeUrl = process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL || "http://localhost:3333";
    
    // Get printer config from env or use provided
    const lanIp = printerConfig?.lanIp || process.env.NEXT_PUBLIC_PRINTER_LAN_IP;
    const usbName = printerConfig?.usbPrinterName || process.env.NEXT_PUBLIC_PRINTER_USB_NAME;
    
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
          usb: usbName
            ? {
                printerName: usbName,
              }
            : undefined,
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
        throw new Error(
          "Print Bridge não está acessível. Verifique se o serviço está rodando em " + printBridgeUrl
        );
      }
      throw error;
    }
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

