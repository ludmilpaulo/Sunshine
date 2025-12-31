"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { productsApi, stockApi, authApi } from "@/lib/api";
import { attachBarcodeCapture } from "@/lib/barcodeCapture";
import toast from "react-hot-toast";
import type { Product, User } from "@/lib/api";
import { Plus, Search, Edit, Package, AlertCircle, Scan, CheckCircle, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
    initial_stock: "0",
  });
  const [stockAdjustment, setStockAdjustment] = useState({ productId: 0, qty: 0 });
  const [scanningStatus, setScanningStatus] = useState<{ active: boolean; lastScanned?: string }>({ active: false });

  useEffect(() => {
    loadProducts();
    // Check if user is admin
    authApi.getMe().then((userData) => {
      setUser(userData);
      setIsAdmin(userData.is_superuser || userData.role === "admin");
    }).catch(() => {
      setIsAdmin(false);
    });
  }, [search]);

  useEffect(() => {
    // Enable debug mode in development
    const isDev = process.env.NODE_ENV === "development";
    
    const cleanup = attachBarcodeCapture(async (barcode) => {
      console.log("📷 Barcode scanned:", barcode);
      setScanningStatus({ active: true, lastScanned: barcode });
      
      // Show scanning feedback
      toast.loading(`Escaneando código: ${barcode}...`, { id: "scanning" });
      
      // Check if product exists first
      try {
        const existing = await productsApi.getByBarcode(barcode);
        // Product exists - open edit modal
        toast.dismiss("scanning");
        toast.success(`Produto encontrado: ${existing.name}`, { duration: 3000 });
        setEditingProduct(existing);
        setFormData({
          name: existing.name,
          barcode: existing.barcode,
          sku: existing.sku,
          price: existing.price,
          cost: existing.cost,
          tax_rate: existing.tax_rate,
          active: existing.active,
          initial_stock: String(existing.inventory?.qty_on_hand || 0),
        });
        setShowAddModal(true);
        setScanningStatus({ active: false, lastScanned: barcode });
      } catch (error: any) {
        // Product doesn't exist - open create modal with barcode filled
        toast.dismiss("scanning");
        const errorMsg = error.response?.data?.detail || "Produto não encontrado";
        if (errorMsg === "NOT_FOUND") {
          toast(`Novo produto detectado! Código: ${barcode}`, { icon: "ℹ️", duration: 3000 });
        } else {
          toast.error(`Erro ao buscar produto: ${errorMsg}`, { duration: 3000 });
        }
        setEditingProduct(null);
        setFormData({
          name: "",
          barcode: barcode,
          sku: "",
          price: "",
          cost: "",
          tax_rate: "0",
          active: true,
          initial_stock: "0",
        });
        setShowAddModal(true);
        setScanningStatus({ active: false, lastScanned: barcode });
      }
    }, {
      debug: isDev,
      minLength: 3,
      timeout: 200, // Increased timeout for more accurate detection
      stripPrefix: true,
      stripSuffix: true,
    });
    return cleanup;
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list(search);
      setProducts(data.results || data);
    } catch (error) {
      toast.error("Falha ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    if (!formData.barcode.trim()) {
      toast.error("Código de barras é obrigatório");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    try {
      // Prepare data with proper types
      const submitData: any = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        sku: formData.sku.trim() || "",
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        active: formData.active,
      };

      if (editingProduct) {
        // Remove initial_stock when updating (only used for creation)
        await productsApi.update(editingProduct.id, submitData);
        toast.success("Produto atualizado com sucesso");
      } else {
        // Include initial_stock when creating
        submitData.initial_stock = parseInt(formData.initial_stock, 10) || 0;
        await productsApi.create(submitData);
        toast.success("Produto criado com sucesso");
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
        initial_stock: "0",
      });
      loadProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      console.error("Error response:", error.response?.data);
      
      // Better error handling
      let errorMessage = "Falha ao salvar produto";
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors.join(", ");
        } else {
          // Show field-specific errors
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]: [string, any]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(", ")}`;
            })
            .join("; ");
          errorMessage = fieldErrors || JSON.stringify(error.response.data);
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleStockAdjust = async () => {
    try {
      await stockApi.adjust(stockAdjustment.productId, stockAdjustment.qty, "ADJUSTMENT");
      toast.success("Estoque ajustado");
      setStockAdjustment({ productId: 0, qty: 0 });
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Falha ao ajustar estoque");
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja deletar o produto "${product.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await productsApi.delete(product.id);
      toast.success("Produto deletado com sucesso");
      loadProducts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Falha ao deletar produto";
      toast.error(errorMessage);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Produtos
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base lg:text-lg">Gerencie seu catálogo de produtos</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {scanningStatus.active && (
              <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-md animate-pulse">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-ping"></div>
                <span className="text-xs sm:text-sm font-bold text-blue-700">Escaneando...</span>
              </div>
            )}
            {scanningStatus.lastScanned && !scanningStatus.active && (
              <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl shadow-md">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span className="text-xs sm:text-sm font-bold text-emerald-700 truncate max-w-[150px] sm:max-w-none">
                  Escaneado: {scanningStatus.lastScanned}
                </span>
              </div>
            )}
            {isAdmin && (
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
                    initial_stock: "0",
                  });
                  setShowAddModal(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            )}
          </div>
        </div>

        {/* Scanner Status Card */}
        <div className="card-gradient from-blue-500 via-blue-600 to-indigo-600 group animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg flex-shrink-0">
                <Scan className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg sm:text-xl text-white mb-1">Scanner de Código de Barras</h3>
                <p className="text-blue-100/90 text-xs sm:text-sm">
                  {scanningStatus.active
                    ? "Escaneando código..."
                    : scanningStatus.lastScanned
                    ? `Último código: ${scanningStatus.lastScanned}`
                    : "Pronto para escanear. Escaneie um código de barras para criar ou editar um produto."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl self-start sm:self-auto">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${scanningStatus.active ? "bg-emerald-300 animate-pulse shadow-lg shadow-emerald-300/50" : "bg-slate-300"}`}></div>
              <span className="text-xs sm:text-sm font-bold text-white">
                {scanningStatus.active ? "Ativo" : "Aguardando"}
              </span>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produtos por nome, código de barras ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12 text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando produtos...</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0 animate-slide-up">
            <div className="overflow-x-auto rounded-xl border border-slate-200 -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                    <tr>
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Produto</th>
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">Código de Barras</th>
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Preço</th>
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Estoque</th>
                      <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="text-right py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => (
                    <tr key={product.id} className="table-row animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm sm:text-base lg:text-lg text-slate-900 truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs sm:text-sm text-slate-500 font-medium">SKU: {product.sku}</p>
                            )}
                            <p className="text-xs text-slate-500 font-mono md:hidden mt-1">{product.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden md:table-cell">
                        <span className="text-xs sm:text-sm text-slate-700 font-mono bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200">
                          {product.barcode}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <span className="font-bold text-sm sm:text-base lg:text-lg text-blue-600">
                          {new Intl.NumberFormat("pt-AO", {
                            style: "currency",
                            currency: "AOA",
                          }).format(parseFloat(product.price))}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm sm:text-base lg:text-lg ${
                            (product.inventory?.qty_on_hand ?? 0) <= 10
                              ? "text-orange-600"
                              : "text-slate-900"
                          }`}>
                            {product.inventory?.qty_on_hand ?? 0}
                          </span>
                          {(product.inventory?.qty_on_hand ?? 0) <= 10 && (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                        {product.active ? (
                          <span className="badge-success text-xs">Ativo</span>
                        ) : (
                          <span className="badge-warning text-xs">Inativo</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {isAdmin && (
                            <>
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
                                    initial_stock: String(product.inventory?.qty_on_hand || 0),
                                  });
                                  setShowAddModal(true);
                                }}
                                className="p-2 sm:p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                title="Editar produto"
                              >
                                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setStockAdjustment({ productId: product.id, qty: 0 });
                                }}
                                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Ajustar estoque"
                              >
                                <span className="hidden sm:inline">Estoque</span>
                                <span className="sm:hidden">Est.</span>
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                title="Deletar produto"
                              >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-slide-up border border-slate-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingProduct ? "Editar Produto" : "Adicionar Produto"}
              </h2>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">Preencha os dados do produto</p>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Código de Barras (escaneie para preencher) *
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="input-field font-mono"
                  required
                  placeholder="Escaneie ou digite o código"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Taxa de Imposto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estoque Inicial</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.initial_stock}
                      onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-slate-700">Ativo</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingProduct ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustment.productId > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Ajustar Estoque</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Alteração de Quantidade
                </label>
                <input
                  type="number"
                  value={stockAdjustment.qty}
                  onChange={(e) =>
                    setStockAdjustment({ ...stockAdjustment, qty: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />
                <p className="text-sm text-slate-500 mt-1">Positivo para adicionar, negativo para remover</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStockAdjustment({ productId: 0, qty: 0 })}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button onClick={handleStockAdjust} className="flex-1 btn-primary">
                  Ajustar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

