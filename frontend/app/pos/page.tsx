"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCartStore } from "@/lib/store";
import { productsApi, salesApi, printApi } from "@/lib/api";
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

  useEffect(() => {
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

      const result = await salesApi.checkout(checkoutItems, payments);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ponto de Venda</h1>
          <p className="text-slate-600 mt-1">Escaneie produtos para adicionar ao carrinho</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrinho
                </h2>
                {items.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Escaneie itens para adicionar ao carrinho</p>
                  {loading && (
                    <p className="mt-2 text-sm text-blue-600">Carregando produto...</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{item.product.name}</p>
                        <p className="text-sm text-slate-600">
                          {formatCurrency(parseFloat(item.unit_price))} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200">
                          <button
                            onClick={() => updateQty(item.product.id, item.qty - 1)}
                            className="p-2 hover:bg-slate-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-4 h-4 text-slate-600" />
                          </button>
                          <span className="px-4 py-2 font-semibold text-slate-900 min-w-[3rem] text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, item.qty + 1)}
                            className="p-2 hover:bg-slate-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                        <div className="text-right min-w-[5rem]">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(parseFloat(item.unit_price) * item.qty)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo do Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Imposto:</span>
                  <span className="font-medium">{formatCurrency(getTax())}</span>
                </div>
                <div className="border-t border-slate-300 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  Finalizar Venda
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Pagamento</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["CASH", "CARD", "TRANSFER"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === method
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {method === "CASH" && <DollarSign className="w-6 h-6 mx-auto mb-2" />}
                      {method === "CARD" && <CreditCard className="w-6 h-6 mx-auto mb-2" />}
                      {method === "TRANSFER" && <Receipt className="w-6 h-6 mx-auto mb-2" />}
                      <p className="text-sm font-medium">
                        {method === "CASH" ? "Dinheiro" : method === "CARD" ? "Cartão" : "Transferência"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor Recebido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-semibold"
                  autoFocus
                />
              </div>
              {parseFloat(paymentAmount) > getTotal() && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Troco:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(parseFloat(paymentAmount) - getTotal())}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={checkoutLoading || parseFloat(paymentAmount) < getTotal()}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {checkoutLoading ? "Processando..." : "Finalizar Venda"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
