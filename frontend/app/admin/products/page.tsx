"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi, stockApi } from "@/lib/api";
import { attachBarcodeCapture } from "@/lib/barcodeCapture";
import toast from "react-hot-toast";
import type { Product } from "@/lib/api";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    sku: "",
    price: "",
    cost: "",
    tax_rate: "0",
    active: true,
  });
  const [stockAdjustment, setStockAdjustment] = useState({ productId: 0, qty: 0 });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadProducts();
  }, [router, search]);

  useEffect(() => {
    // Attach barcode scanner for admin product creation
    const cleanup = attachBarcodeCapture(async (barcode) => {
      if (showAddModal || editingProduct) {
        // If we're in a form, auto-fill barcode
        setFormData((prev) => ({ ...prev, barcode }));
        
        // Check if product exists
        try {
          const existing = await productsApi.getByBarcode(barcode);
          toast.success(`Product found: ${existing.name}`);
          setEditingProduct(existing);
          setFormData({
            name: existing.name,
            barcode: existing.barcode,
            sku: existing.sku,
            price: existing.price,
            cost: existing.cost,
            tax_rate: existing.tax_rate,
            active: existing.active,
          });
          setShowAddModal(true);
        } catch {
          // Product doesn't exist, keep form open with barcode filled
          toast("Novo produto - código de barras preenchido", { icon: "ℹ️" });
        }
      }
    });

    return cleanup;
  }, [showAddModal, editingProduct]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list(search);
      setProducts(data.results || data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        toast.success("Product updated");
      } else {
        await productsApi.create(formData);
        toast.success("Product created");
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        barcode: "",
        sku: "",
        price: "",
        cost: "",
        tax_rate: "0",
        active: true,
      });
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save product");
    }
  };

  const handleStockAdjust = async () => {
    try {
      await stockApi.adjust(stockAdjustment.productId, stockAdjustment.qty, "ADJUSTMENT");
      toast.success("Stock adjusted");
      setStockAdjustment({ productId: 0, qty: 0 });
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to adjust stock");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await productsApi.delete(productToDelete.id);
      toast.success("Product deleted successfully");
      setProductToDelete(null);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/pos")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              POS
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  name: "",
                  barcode: "",
                  sku: "",
                  price: "",
                  cost: "",
                  tax_rate: "0",
                  active: true,
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Product
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Barcode</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.barcode}</td>
                    <td className="px-4 py-2">${product.price}</td>
                    <td className="px-4 py-2">
                      {product.inventory?.qty_on_hand ?? 0}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name,
                              barcode: product.barcode,
                              sku: product.sku,
                              price: product.price,
                              cost: product.cost,
                              tax_rate: product.tax_rate,
                              active: product.active,
                            });
                            setShowAddModal(true);
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setStockAdjustment({ productId: product.id, qty: 0 });
                          }}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product);
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barcode (scan to fill)</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustment.productId > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity Change</label>
                <input
                  type="number"
                  value={stockAdjustment.qty}
                  onChange={(e) =>
                    setStockAdjustment({ ...stockAdjustment, qty: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  Positive to add, negative to remove
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStockAdjustment({ productId: 0, qty: 0 })}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockAdjust}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Product</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{productToDelete.name}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. The product will be permanently removed from the system.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

