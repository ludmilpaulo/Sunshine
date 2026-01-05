"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCartStore } from "@/lib/store";
import { productsApi, salesApi, printApi, authApi } from "@/lib/api";
import { attachBarcodeCapture } from "@/lib/barcodeCapture";
import toast from "react-hot-toast";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Receipt, Printer, Copy, Check, AlertTriangle } from "lucide-react";

export default function POSPage() {
  const { items, addItem, removeItem, updateQty, clear, getSubtotal, getTax, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintBridgeModal, setShowPrintBridgeModal] = useState(false);
  const [printBridgeStatus, setPrintBridgeStatus] = useState<"checking" | "running" | "not-running" | "unknown">("checking");
  const [skipPrinting, setSkipPrinting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [userOperationType, setUserOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "BOTH">("SHOP");
  const [selectedOperationType, setSelectedOperationType] = useState<"SHOP" | "SALON" | "STUDIO">("SHOP");

  useEffect(() => {
    // Get user operation type
    authApi.getMe().then((user) => {
      const opType = (user as any).operation_type || "SHOP";
      setUserOperationType(opType as "SHOP" | "SALON" | "STUDIO" | "BOTH");
      // If user has BOTH, default to SHOP, otherwise use their type
      if (opType === "BOTH") {
        setSelectedOperationType("SHOP");
      } else {
        setSelectedOperationType(opType as "SHOP" | "SALON" | "STUDIO");
      }
    });
    
    // Enable debug mode in development
    const isDev = process.env.NODE_ENV === "development";
    
    const cleanup = attachBarcodeCapture(async (barcode) => {
      // Validate barcode before processing
      if (!barcode || barcode.trim().length < 3) {
        console.warn("📷 Invalid barcode received:", barcode);
        return;
      }
      
      const trimmedBarcode = barcode.trim();
      console.log("📷 Barcode scanned:", trimmedBarcode, "Length:", trimmedBarcode.length);
      
      setLoading(true);
      try {
        console.log("🔍 Searching for product with barcode:", trimmedBarcode);
        const product = await productsApi.getByBarcode(trimmedBarcode);
        console.log("✅ Product found:", product);
        
        if (!product) {
          toast.error(`Produto não encontrado com código: ${trimmedBarcode}`, {
            duration: 5000,
            icon: "⚠️",
          });
          return;
        }
        
        if (product.active) {
          addItem(product);
          toast.success(`Adicionado ${product.name}`, {
            duration: 2000,
            icon: "✅",
          });
        } else {
          toast.error("Produto está inativo", {
            duration: 3000,
            icon: "⚠️",
          });
        }
      } catch (error: any) {
        console.error("❌ Error fetching product:", error);
        console.error("Error response:", error.response?.data);
        
        if (error.response?.status === 404) {
          const errorData = error.response?.data;
          const message = errorData?.message || `Produto não encontrado com código: ${trimmedBarcode}`;
          toast.error(message, {
            duration: 5000,
            icon: "⚠️",
          });
          console.warn(`Produto não encontrado. Código escaneado: "${trimmedBarcode}". Verifique se o produto está cadastrado no sistema.`);
        } else if (error.response?.status === 400) {
          const errorData = error.response?.data;
          const detail = errorData?.detail || "Código de barras inválido";
          toast.error(detail, {
            duration: 4000,
            icon: "⚠️",
          });
        } else {
          toast.error(`Falha ao buscar produto: ${error.message || "Erro desconhecido"}`, {
            duration: 4000,
            icon: "❌",
          });
        }
      } finally {
        setLoading(false);
      }
    }, {
      debug: process.env.NODE_ENV === "development", // Only debug in development
      minLength: 3,
      timeout: 150, // Optimized timeout for fast scanners
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

    // Check Print Bridge status before checkout
    try {
      const health = await printApi.checkHealth();
      if (!health.ok) {
        setPrintBridgeStatus("not-running");
        setShowPrintBridgeModal(true);
        return;
      }
      setPrintBridgeStatus("running");
    } catch (error) {
      setPrintBridgeStatus("not-running");
      setShowPrintBridgeModal(true);
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
      // Normalize barcodes before sending to prevent duplication issues
      const normalizeBarcode = (barcode: string): string => {
        let normalized = barcode.trim().replace(/\s+/g, '');
        // If code is too long, try to extract valid barcode (handle duplication)
        if (normalized.length > 20) {
          for (let length = 8; length <= 14; length++) {
            const pattern = normalized.substring(0, length);
            if (pattern.length === length && /^\d+$/.test(pattern)) {
              const repetitions = Math.floor(normalized.length / length);
              if (pattern.repeat(repetitions) === normalized.substring(0, pattern.length * repetitions)) {
                return pattern;
              }
            }
          }
          // Extract first valid length if no pattern found
          for (let length of [13, 12, 14, 8]) {
            if (normalized.length >= length) {
              const candidate = normalized.substring(0, length);
              if (/^\d+$/.test(candidate)) {
                return candidate;
              }
            }
          }
        }
        return normalized;
      };
      
      const checkoutItems = items.map((item) => ({
        barcode: normalizeBarcode(item.product.barcode),
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

      toast.success(`Venda ${result.saleNumber} finalizada com sucesso!`);
      
      // Try to print receipt using browser print API (fallback to Print Bridge if available)
      if (!skipPrinting) {
        try {
          // First try browser printing (simpler, no installation needed)
          await printApi.printReceiptBrowser(result.receipt);
          toast.success("Abrindo diálogo de impressão...", { duration: 2000 });
        } catch (browserPrintError: any) {
          console.warn("Browser print failed, trying Print Bridge:", browserPrintError);
          // Fallback to Print Bridge if browser print fails
          try {
            const health = await printApi.checkHealth();
            if (health.ok) {
              await printApi.printReceipt(result.receipt);
              toast.success("Recibo impresso via Print Bridge", { duration: 3000 });
            } else {
              // Browser print failed and Print Bridge not available
              toast(
                "Venda finalizada! Use o diálogo de impressão do navegador para imprimir o recibo.",
                { 
                  icon: "ℹ️",
                  duration: 5000 
                }
              );
            }
          } catch (printError: any) {
            console.error("Print error:", printError);
            toast(
              "Venda finalizada! Use o diálogo de impressão do navegador (Ctrl+P) para imprimir o recibo.",
              { 
                icon: "ℹ️",
                duration: 5000 
              }
            );
          }
        }
      } else {
        // User chose to skip printing
        toast(
          "Venda finalizada! (Impressão não realizada)",
          { 
            icon: "ℹ️",
            duration: 4000 
          }
        );
      }
      
      clear();
      setShowPaymentModal(false);
      setPaymentAmount("");
      setSkipPrinting(false); // Reset skip flag
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

  // Install Command Component
  const InstallCommand = ({ title, command }: { title: string; command: string }) => {
    const [copied, setCopied] = useState(false);
    
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        toast.success("Comando copiado!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Erro ao copiar comando");
      }
    };

    return (
      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span className="text-slate-600">Copiar</span>
              </>
            )}
          </button>
        </div>
        <code className="text-sm text-slate-900 bg-white px-3 py-2 rounded border border-slate-200 block break-all">
          {command}
        </code>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Ponto de Venda
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base lg:text-lg">Escaneie produtos para adicionar ao carrinho</p>
          </div>
          {userOperationType === "BOTH" && (
            <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-xl shadow-md border border-slate-200">
              <label className="text-xs sm:text-sm font-semibold text-slate-700">Operação:</label>
              <select
                value={selectedOperationType}
                onChange={(e) => setSelectedOperationType(e.target.value as "SHOP" | "SALON" | "STUDIO")}
                className="px-3 sm:px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-semibold bg-white"
              >
                <option value="SHOP">Shop</option>
                <option value="SALON">Salon</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
          {/* Cart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card group">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl lg:text-2xl">Carrinho de Compras</span>
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
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 animate-fade-in gap-3"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base sm:text-lg text-slate-900 mb-1 truncate">{item.product.name}</p>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">
                          {formatCurrency(parseFloat(item.unit_price))} cada
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                          <button
                            onClick={() => updateQty(item.product.id, item.qty - 1)}
                            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-l-xl transition-all duration-200 active:scale-95"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />
                          </button>
                          <span className="px-3 sm:px-5 py-2 sm:py-2.5 font-bold text-slate-900 min-w-[2.5rem] sm:min-w-[3.5rem] text-center text-base sm:text-lg">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, item.qty + 1)}
                            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-r-xl transition-all duration-200 active:scale-95"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />
                          </button>
                        </div>
                        <div className="text-right min-w-[5rem] sm:min-w-[6rem]">
                          <p className="font-bold text-lg sm:text-xl text-blue-600">
                            {formatCurrency(parseFloat(item.unit_price) * item.qty)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                Resumo do Pedido
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-blue-100 font-medium text-sm sm:text-base">Subtotal:</span>
                  <span className="font-bold text-base sm:text-lg text-white">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-blue-100 font-medium text-sm sm:text-base">Imposto:</span>
                  <span className="font-bold text-base sm:text-lg text-white">{formatCurrency(getTax())}</span>
                </div>
                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t-2 border-white/30">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-white">Total:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || checkoutLoading}
              className="w-full btn-primary py-4 sm:py-5 text-base sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 sm:gap-3 shadow-2xl"
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
      {/* Print Bridge Installation Modal */}
      {showPrintBridgeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-slide-up border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Print Bridge Não Está Rodando</h2>
                  <p className="text-slate-600 mt-1">Instale o Print Bridge para imprimir recibos automaticamente</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Importante:</strong> O Print Bridge precisa ser instalado uma vez em cada computador do caixa. 
                    Depois da instalação, ele inicia automaticamente.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-blue-600" />
                    Passo 1: Obter a Pasta do Projeto
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Opção A: Usando Git (Recomendado)</p>
                      <InstallCommand 
                        title="Clonar repositório"
                        command="git clone https://github.com/ludmilpaulo/Sunshine.git && cd Sunshine/print-bridge"
                      />
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Opção B: Download ZIP</p>
                      <p className="text-xs text-slate-600 mb-2">
                        1. Acesse: <a href="https://github.com/ludmilpaulo/Sunshine" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">github.com/ludmilpaulo/Sunshine</a><br/>
                        2. Clique em "Code" → "Download ZIP"<br/>
                        3. Extraia o arquivo ZIP<br/>
                        4. Navegue até: <code className="bg-white px-1 py-0.5 rounded text-xs">Sunshine-main/print-bridge</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-blue-600" />
                    Passo 2: Instalar Print Bridge
                  </h3>
                  
                  <div className="space-y-3">
                    <InstallCommand 
                      title="macOS / Linux"
                      command="chmod +x QUICK_INSTALL.sh && ./QUICK_INSTALL.sh"
                    />
                    <InstallCommand 
                      title="Windows (PowerShell)"
                      command=".\\install-service-windows.bat"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Passos Detalhados:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
                    <li><strong>Obter o código:</strong> Use Git (Opção A) ou baixe ZIP (Opção B)</li>
                    <li><strong>Abrir Terminal:</strong> Terminal (macOS/Linux) ou PowerShell (Windows)</li>
                    <li><strong>Navegar até a pasta:</strong> <code className="bg-slate-100 px-2 py-1 rounded text-xs">cd Sunshine/print-bridge</code> (ou <code className="bg-slate-100 px-2 py-1 rounded text-xs">cd Sunshine-main/print-bridge</code> se baixou ZIP)</li>
                    <li><strong>Executar instalação:</strong> Use os comandos acima (copie e cole)</li>
                    <li><strong>Verificar:</strong> Clique em "Verificar Novamente" quando terminar</li>
                  </ol>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600">
                    <strong>Nota:</strong> O navegador não pode executar scripts automaticamente por segurança. 
                    Você precisa copiar e executar os comandos no terminal manualmente.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowPrintBridgeModal(false);
                  setSkipPrinting(true);
                  // Allow checkout without printing
                  setShowPaymentModal(true);
                  setPaymentAmount(getTotal().toFixed(2));
                }}
                className="flex-1 btn-secondary py-3"
              >
                Continuar sem Imprimir
              </button>
              <button
                onClick={async () => {
                  try {
                    const health = await printApi.checkHealth();
                    if (health.ok) {
                      setPrintBridgeStatus("running");
                      setShowPrintBridgeModal(false);
                      setSkipPrinting(false);
                      toast.success("Print Bridge está rodando!");
                      // Continue with checkout
                      setShowPaymentModal(true);
                      setPaymentAmount(getTotal().toFixed(2));
                    } else {
                      toast.error("Print Bridge ainda não está rodando. Execute a instalação primeiro.");
                    }
                  } catch (error) {
                    toast.error("Print Bridge ainda não está rodando. Execute a instalação primeiro.");
                  }
                }}
                className="flex-1 btn-primary py-3"
              >
                Verificar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-slide-up border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Pagamento
              </h2>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">Selecione o método de pagamento</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(["CASH", "CARD", "TRANSFER"] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 sm:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          isSelected
                            ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-blue-600" : "bg-slate-100"
                        } transition-colors`}>
                          {method === "CASH" && <DollarSign className={`w-4 h-4 sm:w-6 sm:h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                          {method === "CARD" && <CreditCard className={`w-4 h-4 sm:w-6 sm:h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                          {method === "TRANSFER" && <Receipt className={`w-4 h-4 sm:w-6 sm:h-6 ${isSelected ? "text-white" : "text-slate-600"}`} />}
                        </div>
                        <p className={`text-xs sm:text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                          {method === "CASH" ? "Dinheiro" : method === "CARD" ? "Cartão" : "Transferência"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Valor Recebido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field text-xl sm:text-2xl font-bold text-center"
                  autoFocus
                  placeholder="0.00"
                />
              </div>
              {parseFloat(paymentAmount) > getTotal() && (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl animate-fade-in">
                  <p className="text-xs sm:text-sm text-emerald-800 font-semibold uppercase tracking-wide mb-1">Troco:</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {formatCurrency(parseFloat(paymentAmount) - getTotal())}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary py-3 sm:py-4 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={checkoutLoading || parseFloat(paymentAmount) < getTotal()}
                  className="flex-1 btn-primary py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
