import { create } from "zustand";
import type { Product, CartItem } from "./api";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product, qty = 1) => {
    const items = get().items;
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            qty,
            unit_price: product.price,
          },
        ],
      });
    }
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },
  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      ),
    });
  },
  clear: () => set({ items: [] }),
  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      return sum + parseFloat(item.unit_price) * item.qty;
    }, 0);
  },
  getTax: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = parseFloat(item.unit_price) * item.qty;
      const taxRate = parseFloat(item.product.tax_rate) / 100;
      return sum + lineTotal * taxRate;
    }, 0);
  },
  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },
}));

