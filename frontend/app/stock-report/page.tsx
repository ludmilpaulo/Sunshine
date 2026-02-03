"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { analyticsApi, authApi } from "@/lib/api";
import {
  Package,
  TrendingDown,
  DollarSign,
  Filter,
  Calendar,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

type Period = "day" | "week" | "month";

export default function StockReportPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [operationType, setOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [userOperationType, setUserOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "BOTH">("SHOP");
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    authApi
      .getMe()
      .then((user: any) => {
        const opType = user.operation_type || "SHOP";
        setUserOperationType(opType);
        if (opType !== "BOTH") {
          setOperationType(opType);
        }
        setUserLoaded(true);
      })
      .catch(() => setUserLoaded(true));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(amount);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        period,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        operation_type: operationType !== "ALL" ? operationType : undefined,
      };
      const data = await analyticsApi.getProductSalesStockReport(params);
      setReportData(data);
    } catch (error: any) {
      console.error("Error loading report:", error);
      const msg = error?.response?.data?.detail || error?.message || "Erro ao carregar relatório";
      toast.error(typeof msg === "string" ? msg : "Erro ao carregar relatório");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoaded) loadReport();
  }, [period, userLoaded]);

  const handleApplyFilter = () => {
    loadReport();
  };

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "day":
        return "Hoje";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
    }
  };

  const getDateRangeLabel = () => {
    if (dateFrom && dateTo) return `${dateFrom} a ${dateTo}`;
    if (dateFrom) return `A partir de ${dateFrom}`;
    if (dateTo) return `Até ${dateTo}`;
    return getPeriodLabel(period);
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Relatório de Vendas por Produto
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Quantidade vendida, stock que saiu e receita por produto
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card animate-slide-up border border-slate-200/80 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="input-field font-semibold"
              >
                <option value="day">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
              </select>
            </div>
            {userOperationType === "BOTH" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Operação
                </label>
                <select
                  value={operationType}
                  onChange={(e) =>
                    setOperationType(e.target.value as "SHOP" | "SALON" | "STUDIO" | "ALL")
                  }
                  className="input-field font-semibold"
                >
                  <option value="ALL">Todas</option>
                  <option value="SHOP">Shop</option>
                  <option value="SALON">Salon</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                <Calendar className="inline w-4 h-4 mr-1" /> Data Inicial
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                <Calendar className="inline w-4 h-4 mr-1" /> Data Final
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                onClick={handleApplyFilter}
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Filter className="w-5 h-5" />
                    Aplicar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !reportData ? (
          <div className="card text-center py-16">
            <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-slate-600 font-medium">A carregar relatório...</p>
          </div>
        ) : null}

        {/* Summary Cards */}
        {reportData && reportData.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
            <div className="card-gradient from-emerald-500 via-emerald-600 to-teal-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                    Unidades Vendidas
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                    {reportData.summary.total_quantity_sold.toLocaleString("pt-AO")}
                  </p>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="card-gradient from-blue-500 via-blue-600 to-indigo-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-blue-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                    Receita Total
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">
                    {formatCurrency(reportData.summary.total_revenue)}
                  </p>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="card-gradient from-amber-500 via-orange-500 to-orange-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-amber-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">
                    Produtos com Vendas
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                    {reportData.summary.product_count}
                  </p>
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {reportData && (
          <div className="card animate-slide-up overflow-hidden border border-slate-200/80 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Detalhe por Produto
              </h2>
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                {getDateRangeLabel()}
              </span>
            </div>

            {reportData.products && reportData.products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                        Código
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Qtd. Vendida
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Stock Saído
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.products.map((product: any, index: number) => (
                      <tr
                        key={product.product_id}
                        className="table-row group hover:bg-emerald-50/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-slate-900">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <span className="text-slate-600 font-mono text-sm">{product.barcode || "—"}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">
                            {product.quantity_sold.toLocaleString("pt-AO")}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800">
                            {product.stock_out.toLocaleString("pt-AO")}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(product.revenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  Nenhuma venda encontrada no período selecionado
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Ajuste os filtros e tente novamente
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
