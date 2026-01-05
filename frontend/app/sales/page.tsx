"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { salesApi, usersApi } from "@/lib/api";
import toast from "react-hot-toast";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { Search, Calendar, Download, User } from "lucide-react";

type Period = "day" | "week" | "month" | "custom";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [period, setPeriod] = useState<Period>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
    applyPeriodFilter("month"); // Initialize with current month
  }, []);

  useEffect(() => {
    loadSales();
  }, [dateFrom, dateTo, selectedUserId]);

  const loadUsers = async () => {
    try {
      const data = await usersApi.list();
      setUsers(data.results || data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const applyPeriodFilter = (selectedPeriod: Period) => {
    setPeriod(selectedPeriod);
    const now = new Date();
    
    if (selectedPeriod === "day") {
      setDateFrom(format(startOfDay(now), "yyyy-MM-dd"));
      setDateTo(format(endOfDay(now), "yyyy-MM-dd"));
    } else if (selectedPeriod === "week") {
      setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (selectedPeriod === "month") {
      setDateFrom(format(startOfMonth(now), "yyyy-MM-dd"));
      setDateTo(format(endOfMonth(now), "yyyy-MM-dd"));
    } else {
      // Custom - don't auto-set dates
      setDateFrom("");
      setDateTo("");
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await salesApi.list(
        dateFrom || undefined, 
        dateTo || undefined, 
        undefined,
        selectedUserId
      );
      const salesList = data.results || data;
      setSales(salesList);
      
      // Alert if user selected but no sales found
      if (selectedUserId && salesList.length === 0) {
        const selectedUser = users.find(u => u.id === selectedUserId);
        const userName = selectedUser?.full_name || selectedUser?.username || "o usuário selecionado";
        const periodText = period === "day" ? "hoje" : period === "week" ? "esta semana" : period === "month" ? "este mês" : "no período selecionado";
        toast(
          `${userName} não realizou nenhuma venda ${periodText}.`,
          { 
            icon: "ℹ️",
            duration: 5000 
          }
        );
      }
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
          <div className="space-y-4">
            {/* Period Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPeriodFilter("day")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => applyPeriodFilter("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => applyPeriodFilter("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Este Mês
              </button>
              <button
                onClick={() => applyPeriodFilter("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === "custom"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Todos os Usuários</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.username || `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>
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
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPeriod("custom");
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Data Inicial"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPeriod("custom");
                  }}
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
