"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { analyticsApi, authApi } from "@/lib/api";
import {
  Package,
  Plus,
  Minus,
  Filter,
  Calendar,
  History,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

type Period = "day" | "week" | "month";

export default function StockMovementsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [operationType, setOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [userOperationType, setUserOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "BOTH">("SHOP");
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "timeline">("summary");

  useEffect(() => {
    authApi
      .getMe()
      .then((user: any) => {
        const opType = user.operation_type || "SHOP";
        setUserOperationType(opType);
        if (opType !== "BOTH") setOperationType(opType);
        setUserLoaded(true);
      })
      .catch(() => setUserLoaded(true));
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        period,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        operation_type: operationType !== "ALL" ? operationType : undefined,
      };
      const data = await analyticsApi.getStockMovementReport(params);
      setReportData(data);
    } catch (error: any) {
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

  const handleApplyFilter = () => loadReport();

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "day": return "Hoje";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
    }
  };

  const getDateRangeLabel = () => {
    if (dateFrom && dateTo) return `${dateFrom} a ${dateTo}`;
    if (dateFrom) return `A partir de ${dateFrom}`;
    if (dateTo) return `Até ${dateTo}`;
    return getPeriodLabel(period);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Histórico de Stock
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Quando o stock foi adicionado, saídas por vendas e stock atual por produto
          </p>
        </div>

        {/* Filters */}
        <div className="card animate-slide-up border border-slate-200/80 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Período</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="input-field font-semibold">
                <option value="day">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
              </select>
            </div>
            {userOperationType === "BOTH" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Operação</label>
                <select value={operationType} onChange={(e) => setOperationType(e.target.value as any)} className="input-field font-semibold">
                  <option value="ALL">Todas</option>
                  <option value="SHOP">Shop</option>
                  <option value="SALON">Salon</option>
                  <option value="STUDIO">Studio</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide"><Calendar className="inline w-4 h-4 mr-1" /> Data Inicial</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide"><Calendar className="inline w-4 h-4 mr-1" /> Data Final</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button onClick={handleApplyFilter} disabled={loading} className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Carregando...</> : <><Filter className="w-5 h-5" /> Aplicar</>}
              </button>
            </div>
          </div>
        </div>

        {loading && !reportData ? (
          <div className="card text-center py-16">
            <div className="w-14 h-14 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-slate-600 font-medium">A carregar histórico...</p>
          </div>
        ) : null}

        {/* Summary Cards */}
        {reportData && reportData.summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up">
            <div className="card-gradient from-emerald-500 via-emerald-600 to-teal-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Stock Adicionado</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{reportData.summary.total_added.toLocaleString("pt-AO")}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0"><Plus className="w-7 h-7 text-white" /></div>
              </div>
            </div>
            <div className="card-gradient from-rose-500 via-red-500 to-red-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-rose-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Stock Vendido</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{reportData.summary.total_sold.toLocaleString("pt-AO")}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0"><Minus className="w-7 h-7 text-white" /></div>
              </div>
            </div>
            <div className="card-gradient from-violet-500 via-purple-600 to-indigo-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-violet-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Variação Líquida</p>
                  <p className={`text-3xl sm:text-4xl font-bold text-white drop-shadow-lg ${reportData.summary.net_change >= 0 ? "" : ""}`}>
                    {reportData.summary.net_change >= 0 ? "+" : ""}{reportData.summary.net_change.toLocaleString("pt-AO")}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0"><ArrowUpDown className="w-7 h-7 text-white" /></div>
              </div>
            </div>
            <div className="card-gradient from-amber-500 via-orange-500 to-orange-600 group overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-amber-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Movimentos</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{reportData.summary.movement_count}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0"><History className="w-7 h-7 text-white" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {reportData && (
          <div className="animate-slide-up">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all ${activeTab === "summary" ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                <Package className="w-5 h-5" /> Por Produto
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all ${activeTab === "timeline" ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                <History className="w-5 h-5" /> Linha do Tempo
              </button>
            </div>

            {activeTab === "summary" && (
              <div className="card overflow-hidden border border-slate-200/80 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
                    Stock por Produto
                  </h2>
                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">{getDateRangeLabel()}</span>
                </div>
                {reportData.products && reportData.products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Produto</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase hidden sm:table-cell">Código</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Adicionado</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Vendido</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Variação</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Stock Actual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.products.map((p: any) => (
                          <tr key={p.product_id} className="table-row group hover:bg-violet-50/50 transition-colors">
                            <td className="px-4 sm:px-6 py-4 font-semibold text-slate-900">{p.product_name}</td>
                            <td className="px-4 sm:px-6 py-4 hidden sm:table-cell font-mono text-sm text-slate-600">{p.barcode || "—"}</td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">+{p.qty_added}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-rose-100 text-rose-800">-{p.qty_sold}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right font-semibold">
                              <span className={p.net_change >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                {p.net_change >= 0 ? "+" : ""}{p.net_change}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-violet-100 text-violet-800">{p.current_stock}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum movimento no período</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="card overflow-hidden border border-slate-200/80 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-white" /></div>
                    Linha do Tempo
                  </h2>
                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">{getDateRangeLabel()}</span>
                </div>
                {reportData.movements && reportData.movements.length > 0 ? (
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Data & Hora</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Produto</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Alteração</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Venda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.movements.map((m: any) => (
                          <tr key={m.id} className="table-row group hover:bg-violet-50/50 transition-colors">
                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                            <td className="px-4 sm:px-6 py-4 font-semibold text-slate-900">{m.product_name}</td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                m.reason === "SALE" ? "bg-rose-100 text-rose-800" :
                                m.reason === "RESTOCK" ? "bg-emerald-100 text-emerald-800" :
                                "bg-amber-100 text-amber-800"
                              }`}>{m.reason_display}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right font-bold">
                              <span className={m.qty_change >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                {m.qty_change >= 0 ? "+" : ""}{m.qty_change}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 font-mono">{m.sale_number || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum movimento no período</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
