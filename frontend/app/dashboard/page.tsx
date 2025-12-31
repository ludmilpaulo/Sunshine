"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardApi } from "@/lib/api";
import type { DashboardStats } from "@/lib/api";
import { DollarSign, ShoppingBag, Package, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, chartDataRes, topProductsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getSalesChart(),
        dashboardApi.getTopProducts(),
      ]);
      setStats(statsData);
      setChartData(chartDataRes);
      setTopProducts(topProductsRes);
    } catch (error) {
      toast.error("Falha ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando painel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(amount);
  };

  const revenueGrowth = stats.sales.revenue_growth;
  const isPositiveGrowth = revenueGrowth >= 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
            Painel de Controle
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <div className="card-gradient from-blue-500 via-blue-600 to-blue-700 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100/90 text-sm font-semibold uppercase tracking-wide mb-2">Receita de Hoje</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">{formatCurrency(stats.sales.today_revenue)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                  <p className="text-blue-100/90 text-sm font-medium">{stats.sales.today_count} vendas realizadas</p>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card-gradient from-emerald-500 via-emerald-600 to-green-600 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-emerald-100/90 text-sm font-semibold uppercase tracking-wide mb-2">Receita do Mês</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">{formatCurrency(stats.sales.month_revenue)}</p>
                <div className="flex items-center gap-2 mt-2">
                  {isPositiveGrowth ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-200" />
                      <p className="text-emerald-100/90 text-sm font-semibold">
                        +{formatCurrency(Math.abs(revenueGrowth))}
                      </p>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-200" />
                      <p className="text-red-200 text-sm font-semibold">
                        {formatCurrency(Math.abs(revenueGrowth))}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card-gradient from-violet-500 via-purple-600 to-indigo-600 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-100/90 text-sm font-semibold uppercase tracking-wide mb-2">Total de Produtos</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">{stats.products.total}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                  <p className="text-purple-100/90 text-sm font-medium">{stats.products.active} produtos ativos</p>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <Package className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card-gradient from-amber-500 via-orange-500 to-orange-600 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-orange-100/90 text-sm font-semibold uppercase tracking-wide mb-2">Estoque Baixo</p>
                <p className="text-4xl font-bold mb-1 drop-shadow-lg">{stats.products.low_stock}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse"></div>
                  <p className="text-orange-100/90 text-sm font-medium">Precisam de reposição</p>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <ShoppingBag className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <div className="card group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Tendência de Vendas</h2>
              <span className="text-sm text-slate-500 font-medium">Últimos 30 Dias</span>
            </div>
            {chartData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.labels.map((label: string, i: number) => ({
                  date: format(new Date(label), "MMM dd"),
                  revenue: chartData.revenue[i],
                  count: chartData.count[i],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Receita (AOA)"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Quantidade de Vendas"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Produtos Mais Vendidos</h2>
              <span className="text-sm text-slate-500 font-medium">Top 5</span>
            </div>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="product_name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total_sold" fill="#3b82f6" name="Unidades Vendidas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Vendas Recentes</h2>
            <span className="text-sm text-slate-500 font-medium">Últimas transações</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Venda #</th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Caixa</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Valor</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_sales.map((sale, index) => (
                  <tr key={sale.id} className="table-row animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900">{sale.number}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700 font-medium">{sale.cashier}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-lg text-blue-600">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-slate-600 text-sm">{format(new Date(sale.created_at), "MMM dd, yyyy HH:mm")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

