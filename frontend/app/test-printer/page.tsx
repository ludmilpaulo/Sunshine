"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { printApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Printer, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";

export default function TestPrinterPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      const printBridgeUrl = process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL || "http://localhost:3333";
      const response = await fetch(`${printBridgeUrl}/printers`);
      if (response.ok) {
        const data = await response.json();
        setPrinters(data.printers || []);
      } else {
        toast.error("Não foi possível listar impressoras");
      }
    } catch (error: any) {
      console.error("Error loading printers:", error);
      toast.error("Print Bridge não está acessível. Verifique se o serviço está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async () => {
    setTesting(true);
    setLastTestResult(null);
    
    try {
      const testReceipt = {
        shopName: "Sunshine POS - Teste",
        shopPhone: "+244 923 456 789",
        shopAddress: "Luanda, Angola",
        saleNumber: `TEST-${Date.now()}`,
        date: new Date().toLocaleString("pt-AO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        subtotal: "1,000.00",
        tax: "140.00",
        total: "1,140.00",
        items: [
          {
            name: "Teste de Impressão",
            qty: 1,
            unitPrice: "1,000.00",
            total: "1,000.00",
          },
        ],
        footer: "Teste de impressora - Obrigado!",
      };

      await printApi.printReceipt(testReceipt);
      
      setLastTestResult({
        success: true,
        message: "Recibo de teste enviado com sucesso! Verifique a impressora.",
      });
      toast.success("Impressão enviada com sucesso!");
    } catch (error: any) {
      const errorMessage = error.message || "Erro desconhecido na impressão";
      setLastTestResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Falha na impressão: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const testDiscovery = async () => {
    setLoading(true);
    try {
      const getPrintBridgeUrl = () => {
        if (process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL) {
          return process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL;
        }
        const isProduction = typeof window !== "undefined" && 
          (window.location.hostname.includes("vercel.app") || 
           window.location.hostname.includes("sunshinebar"));
        if (isProduction) {
          return "http://localhost:3333";
        }
        return "http://localhost:3333";
      };
      const printBridgeUrl = getPrintBridgeUrl();
      const response = await fetch(`${printBridgeUrl}/discover`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.printer) {
          toast.success(`Impressora encontrada: ${data.printer.ip}:${data.printer.port}`);
          loadPrinters(); // Reload printers list
        } else {
          toast.error("Nenhuma impressora encontrada automaticamente");
        }
      }
    } catch (error: any) {
      toast.error("Erro ao tentar descobrir impressoras");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Teste de Impressora</h1>
          <p className="text-slate-600">
            Teste a configuração e funcionamento da impressora.
          </p>
        </div>

        {/* Print Bridge Status */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Status do Print Bridge</h2>
              <p className="text-sm text-slate-600">
                {loading ? "Verificando..." : "Serviço de impressão"}
              </p>
            </div>
            <button
              onClick={loadPrinters}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-slate-600">Carregando impressoras...</p>
            </div>
          ) : printers.length > 0 ? (
            <div className="space-y-2">
              {printers.map((printer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">{printer.name}</p>
                      {printer.ip && (
                        <p className="text-sm text-slate-600">
                          {printer.type === "LAN" ? `LAN: ${printer.ip}:${printer.port || 9100}` : "USB"}
                        </p>
                      )}
                      {printer.hostname && (
                        <p className="text-sm text-slate-500">Hostname: {printer.hostname}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {printer.type === "LAN" && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        LAN
                      </span>
                    )}
                    {printer.type === "USB" && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        USB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <Printer className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-2">Nenhuma impressora configurada</p>
              <button
                onClick={testDiscovery}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Tentar descobrir automaticamente
              </button>
            </div>
          )}
        </div>

        {/* Test Print */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Teste de Impressão</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>O que será impresso:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Nome da loja: Sunshine POS - Teste</li>
              <li>Número da venda: TEST-{Date.now()}</li>
              <li>Data e hora atual</li>
              <li>Item de teste: 1x Teste de Impressão - 1,000.00 AOA</li>
              <li>Subtotal, imposto e total</li>
            </ul>
          </div>

          <button
            onClick={testPrint}
            disabled={testing || printers.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando para impressora...
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                Imprimir Recibo de Teste
              </>
            )}
          </button>

          {lastTestResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              lastTestResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              {lastTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  lastTestResult.success ? "text-green-900" : "text-red-900"
                }`}>
                  {lastTestResult.success ? "Sucesso!" : "Erro"}
                </p>
                <p className={`text-sm mt-1 ${
                  lastTestResult.success ? "text-green-700" : "text-red-700"
                }`}>
                  {lastTestResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting */}
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">💡 Dicas de Troubleshooting:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Certifique-se de que o Print Bridge está rodando (porta 3333)</li>
            <li>Verifique se a impressora está ligada e conectada à rede</li>
            <li>Se usar LAN, verifique se o IP/hostname está correto</li>
            <li>Teste a conectividade: ping IP_DA_IMPRESSORA</li>
            <li>Verifique os logs do Print Bridge no terminal</li>
            <li>Use o botão "Tentar descobrir automaticamente" para auto-configuração</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

