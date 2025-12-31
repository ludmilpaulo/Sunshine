"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { salesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Search, Calendar, Download } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSales();
  }, [dateFrom, dateTo]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await salesApi.list(dateFrom || undefined, dateTo || undefined);
      setSales(data.results || data);
    } catch (error) {
      toast.error("Falha ao carregar vendas");
    } finally {
      setLoading(false);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Histórico de Vendas</h1>
            <p className="text-slate-600 mt-1">Visualize e gerencie todas as transações de vendas</p>
          </div>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar vendas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Data Inicial"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Data Final"
              />
            </div>
            <button
              onClick={loadSales}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando vendas...</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Venda #</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Caixa</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Produtos</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Subtotal</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Imposto</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Total</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {sales
                    .filter((sale) =>
                      search
                        ? sale.number.toLowerCase().includes(search.toLowerCase()) ||
                          sale.cashier_name?.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <span className="font-mono font-semibold text-slate-900">{sale.number}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{sale.cashier_name || sale.cashier_username}</td>
                        <td className="py-4 px-6 text-slate-600">
                          <div className="space-y-1">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.map((item: any, index: number) => (
                                <div key={item.id || index} className="text-sm">
                                  <span className="font-medium text-slate-900">
                                    {item.product_name || item.product?.name || "Produto desconhecido"}
                                  </span>
                                  <span className="text-slate-500 ml-2">
                                    (x{item.qty})
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-400">Nenhum item</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-600">
                          {formatCurrency(parseFloat(sale.subtotal))}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-600">
                          {formatCurrency(parseFloat(sale.tax))}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(parseFloat(sale.total))}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-600">
                          {format(new Date(sale.created_at), "MMM dd, yyyy HH:mm")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

