"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { attachBarcodeCapture } from "@/lib/barcodeCapture";
import toast from "react-hot-toast";

export default function TestScannerPage() {
  const [scannedCodes, setScannedCodes] = useState<Array<{ code: string; time: Date }>>([]);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    if (!isListening) return;

    const cleanup = attachBarcodeCapture((barcode) => {
      console.log("✅ Barcode captured:", barcode);
      setScannedCodes((prev) => [
        { code: barcode, time: new Date() },
        ...prev.slice(0, 19), // Keep last 20
      ]);
      toast.success(`Código escaneado: ${barcode}`);
    }, {
      debug: true,
      minLength: 1, // Accept any length for testing
      timeout: 200,
      stripPrefix: true,
      stripSuffix: true,
    });

    return cleanup;
  }, [isListening]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Teste do Scanner de Código de Barras</h1>
          <p className="text-slate-600">
            Escaneie um código de barras para verificar se o scanner está funcionando corretamente.
          </p>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Status do Scanner</h2>
              <p className="text-sm text-slate-600">
                {isListening ? "✅ Ouvindo..." : "⏸️ Pausado"}
              </p>
            </div>
            <button
              onClick={() => setIsListening(!isListening)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isListening
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isListening ? "Pausar" : "Retomar"}
            </button>
          </div>

          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium text-slate-700 mb-2">
              {isListening ? "Pronto para escanear" : "Scanner pausado"}
            </p>
            <p className="text-sm text-slate-500">
              {isListening
                ? "Aponte o scanner para um código de barras e escaneie"
                : "Clique em 'Retomar' para começar a escutar"}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Códigos Escaneados ({scannedCodes.length})
          </h2>
          {scannedCodes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>Nenhum código escaneado ainda.</p>
              <p className="text-sm mt-2">Escaneie um código de barras para começar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scannedCodes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <p className="font-mono font-semibold text-slate-900 text-lg">{item.code}</p>
                    <p className="text-sm text-slate-500">
                      {item.time.toLocaleTimeString("pt-AO")}
                    </p>
                  </div>
                  <div className="text-green-600">✓</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas de Troubleshooting:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Certifique-se de que o scanner está conectado e configurado como "Keyboard Wedge"</li>
            <li>Verifique se o foco está na página (clique em qualquer lugar da página)</li>
            <li>Alguns scanners precisam ser configurados para enviar Enter ou Tab no final</li>
            <li>Abra o Console do navegador (F12) para ver logs detalhados</li>
            <li>Teste digitando manualmente um código e pressionando Enter</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

