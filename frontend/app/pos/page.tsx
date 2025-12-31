"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCartStore } from "@/lib/store";
import { productsApi, salesApi, printApi, authApi } from "@/lib/api";
import { attachBarcodeCapture } from "@/lib/barcodeCapture";
import toast from "react-hot-toast";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Receipt } from "lucide-react";

export default function POSPage() {
  const { items, addItem, removeItem, updateQty, clear, getSubtotal, getTax, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [userOperationType, setUserOperationType] = useState<"SALON" | "STUDIO" | "BOTH">("SALON");
  const [selectedOperationType, setSelectedOperationType] = useState<"SALON" | "STUDIO">("SALON");

  useEffect(() => {
    // Get user operation type
    authApi.getMe().then((user) => {
      const opType = (user as any).operation_type || "SALON";
      setUserOperationType(opType);
      // If user has BOTH, default to SALON, otherwise use their type
      if (opType === "BOTH") {
        setSelectedOperationType("SALON");
      } else {
        setSelectedOperationType(opType as "SALON" | "STUDIO");
      }
    });
    
    // Enable debug mode in development
    const isDev = process.env.NODE_ENV === "development";
    
    const cleanup = attachBarcodeCapture(async (barcode) => {
      console.log("📷 Barcode scanned:", barcode, "Length:", barcode.length);
      setLoading(true);
      try {
        console.log("🔍 Searching for product with barcode:", barcode);
        const product = await productsApi.getByBarcode(barcode);
        console.log("✅ Product found:", product);
        if (product.active) {
          addItem(product);
          toast.success(`Adicionado ${product.name}`);
        } else {
          toast.error("Produto está inativo");
        }
      } catch (error: any) {
        console.error("❌ Error fetching product:", error);
        console.error("Error response:", error.response?.data);
        if (error.response?.status === 404) {
          toast.error(`Produto não encontrado: ${barcode}`);
        } else {
          toast.error(`Falha ao buscar produto: ${error.message || "Erro desconhecido"}`);
        }
      } finally {
        setLoading(false);
      }
    }, {
      debug: isDev,
      minLength: 3,
      timeout: 200, // Increased timeout for more accurate detection
      stripPrefix: true,
      stripSuffix: true,
    });

    return cleanup;
  }, [addItem]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    setShowPaymentModal(true);
    setPaymentAmount(getTotal().toFixed(2));
  };

  const handleProcessPayment = async () => {
    if (items.length === 0) return;

    const total = getTotal();
    const paid = parseFloat(paymentAmount);

    if (paid < total) {
      toast.error("Valor pago é menor que o total");
      return;
    }

    setCheckoutLoading(true);
    try {
      const checkoutItems = items.map((item) => ({
        barcode: item.product.barcode,
        qty: item.qty,
        unit_price: item.unit_price,
      }));

      const payments = [
        {
          method: paymentMethod,
          amount: total.toFixed(2),
          reference: "",
        },
      ];

      if (paid > total) {
        payments.push({
          method: "CASH",
          amount: (paid - total).toFixed(2),
          reference: "TROCO",
        });
      }

      const result = await salesApi.checkout(checkoutItems, payments, selectedOperationType);

      // Try to print receipt (non-blocking)
      try {
        await printApi.printReceipt(result.receipt);
        toast.success("Recibo impresso com sucesso");
      } catch (printError: any) {
        console.error("Print error:", printError);
        const errorMessage = printError?.message || "Erro desconhecido na impressão";
        
        // Show a warning but don't block the sale
        toast.error(
          `Venda finalizada! Mas a impressão falhou: ${errorMessage}`,
          { duration: 5000 }
        );
      }

      toast.success(`Venda ${result.saleNumber} finalizada com sucesso!`);
      clear();
      setShowPaymentModal(false);
      setPaymentAmount("");
    } catch (error: any) {
      const detail = error.response?.data?.detail || "Falha ao finalizar venda";
      if (detail.includes("OUT_OF_STOCK")) {
        toast.error("Estoque insuficiente");
      } else {
        toast.error(detail);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Ponto de Venda
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Escaneie produtos para adicionar ao carrinho</p>
          </div>
          {userOperationType === "BOTH" && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200">
              <label className="text-sm font-semibold text-slate-700">Operação:</label>
              <select
                value={selectedOperationType}
                onChange={(e) => setSelectedOperationType(e.target.value as "SALON" | "STUDIO")}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-semibold bg-white"
              >
                <option value="SALON">Salon</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Cart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card group">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  Carrinho de Compras
                </h2>
                {items.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium text-lg">Escaneie itens para adicionar ao carrinho</p>
                  {loading && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-blue-600 font-medium">Carregando produto...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-900 mb-1">{item.product.name}</p>
                        <p className="text-sm text-slate-600 font-medium">
                          {formatCurrency(parseFloat(item.unit_price))} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                          <button
                            onClick={() => updateQty(item.product.id, item.qty - 1)}
                            className="p-2.5 hover:bg-slate-100 rounded-l-xl transition-all duration-200 active:scale-95"
                          >
                            <Minus className="w-4 h-4 text-slate-700" />
                          </button>
                          <span className="px-5 py-2.5 font-bold text-slate-900 min-w-[3.5rem] text-center text-lg">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, item.qty + 1)}
                            className="p-2.5 hover:bg-slate-100 rounded-r-xl transition-all duration-200 active:scale-95"
                          >
                            <Plus className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                        <div className="text-right min-w-[6rem]">
                          <p className="font-bold text-xl text-blue-600">
                            {formatCurrency(parseFloat(item.unit_price) * item.qty)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-95"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Totals & Checkout */}
          <div className="space-y-4">
            <div className="card-gradient from-blue-500 via-blue-600 to-indigo-600 group">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                Resumo do Pedido
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-blue-100 font-medium">Subtotal:</span>
                  <span className="font-bold text-lg text-white">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-blue-100 font-medium">Imposto:</span>
                  <span className="font-bold text-lg text-white">{formatCurrency(getTax())}</span>
                </div>
                <div className="pt-4 mt-4 border-t-2 border-white/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">Total:</span>
                    <span className="text-3xl font-extrabold text-white drop-shadow-lg">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full btn-primary py-5 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-2xl"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-6 h-6" />
                  <span>Finalizar Venda</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Pagamento
              </h2>
              <p className="text-slate-600 mt-1 text-sm">Selecione o método de pagamento</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["CASH", "CARD", "TRANSFER"] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          isSelected
                            ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-blue-600" : "bg-slate-100"
                        } transition-colors`}>
                          {method === "CASH" && <DollarSign className={`w-6 h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                          {method === "CARD" && <CreditCard className={`w-6 h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                          {method === "TRANSFER" && <Receipt className={`w-6 h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                        </div>
                        <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                          {method === "CASH" ? "Dinheiro" : method === "CARD" ? "Cartão" : "Transferência"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Valor Recebido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field text-2xl font-bold text-center"
                  autoFocus
                  placeholder="0.00"
                />
              </div>
              {parseFloat(paymentAmount) > getTotal() && (
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl animate-fade-in">
                  <p className="text-sm text-emerald-800 font-semibold uppercase tracking-wide mb-1">Troco:</p>
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {formatCurrency(parseFloat(paymentAmount) - getTotal())}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary py-4"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={checkoutLoading || parseFloat(paymentAmount) < getTotal()}
                  className="flex-1 btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </span>
                  ) : (
                    "Finalizar Venda"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
