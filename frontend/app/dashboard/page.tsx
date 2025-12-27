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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Painel</h1>
          <p className="text-slate-600 mt-1">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Receita de Hoje</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.sales.today_revenue)}</p>
                <p className="text-blue-100 text-sm mt-1">{stats.sales.today_count} vendas</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Receita do Mês</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.sales.month_revenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {isPositiveGrowth ? (
                    <TrendingUp className="w-4 h-4 text-green-100" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-200" />
                  )}
                  <p className={`text-sm ${isPositiveGrowth ? "text-green-100" : "text-red-200"}`}>
                    {isPositiveGrowth ? "+" : ""}
                    {formatCurrency(Math.abs(revenueGrowth))}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total de Produtos</p>
                <p className="text-3xl font-bold mt-2">{stats.products.total}</p>
                <p className="text-purple-100 text-sm mt-1">{stats.products.active} ativos</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Estoque Baixo</p>
                <p className="text-3xl font-bold mt-2">{stats.products.low_stock}</p>
                <p className="text-orange-100 text-sm mt-1">Itens precisam de reposição</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Tendência de Vendas (Últimos 30 Dias)</h2>
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

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Produtos Mais Vendidos</h2>
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
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Vendas Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Venda #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Caixa</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Valor</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{sale.number}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{sale.cashier}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-slate-600">
                      {format(new Date(sale.created_at), "MMM dd, yyyy HH:mm")}
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

