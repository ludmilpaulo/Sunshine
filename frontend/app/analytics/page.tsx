"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { analyticsApi, authApi } from "@/lib/api";
import { BarChart3, TrendingUp, Users, Award, Calendar, Filter, CreditCard, DollarSign, Receipt } from "lucide-react";
import toast from "react-hot-toast";

type Period = "day" | "week" | "month";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [operationType, setOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [salesDataWithTax, setSalesDataWithTax] = useState<any>(null);
  const [paymentMethodData, setPaymentMethodData] = useState<any>(null);
  const [topSellers, setTopSellers] = useState<any>(null);
  const [userOperationType, setUserOperationType] = useState<"SHOP" | "SALON" | "STUDIO" | "BOTH">("SHOP");

  useEffect(() => {
    authApi.getMe().then((user) => {
      const opType = (user as any).operation_type || "SHOP";
      setUserOperationType(opType as "SHOP" | "SALON" | "STUDIO" | "BOTH");
      if (opType !== "BOTH") {
        setOperationType(opType as "SHOP" | "SALON" | "STUDIO");
      }
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(amount);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        period,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        operation_type: operationType !== "ALL" ? operationType : undefined,
      };
      
      const [salesResponse, salesWithTaxResponse, paymentMethodResponse, topSellersResponse] = await Promise.all([
        analyticsApi.getSalesByUser(params),
        analyticsApi.getSalesByUserWithTax(params),
        analyticsApi.getSalesByPaymentMethod(params),
        analyticsApi.getTopSellers({ period, limit: 10 }),
      ]);

      setSalesData(salesResponse);
      setSalesDataWithTax(salesWithTaxResponse);
      setPaymentMethodData(paymentMethodResponse);
      setTopSellers(topSellersResponse);
    } catch (error: any) {
      toast.error("Erro ao carregar dados de analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, operationType]);

  const handleFilter = () => {
    loadData();
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

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl lg:text-4xl">Analytics de Vendas</span>
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base lg:text-lg">Análise detalhada de vendas por funcionário</p>
        </div>

        {/* Filters */}
        <div className="card animate-slide-up">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Período</label>
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
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Operação</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value as "SHOP" | "SALON" | "STUDIO" | "ALL")}
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
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Data Inicial</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Data Final</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Carregando...
                  </span>
                ) : (
                  "Aplicar Filtros"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {salesData && salesDataWithTax && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up">
            <div className="card-gradient from-blue-500 via-blue-600 to-indigo-600 group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-blue-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Receita Total</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg mb-1 truncate">
                    {formatCurrency(salesData.summary.total_revenue)}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg flex-shrink-0">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="card-gradient from-emerald-500 via-green-600 to-teal-600 group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Subtotal</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg mb-1 truncate">
                    {formatCurrency(salesDataWithTax.summary.total_subtotal)}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg flex-shrink-0">
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="card-gradient from-red-500 via-rose-600 to-pink-600 group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-red-100/90 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2">Imposto Total</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg mb-1 truncate">
                    {formatCurrency(salesDataWithTax.summary.total_tax)}
                  </p>
                  <p className="text-red-100/90 text-xs font-semibold mt-1">
                    {salesDataWithTax.summary.tax_percentage.toFixed(2)}%
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="card-gradient from-amber-500 via-orange-500 to-orange-600 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-orange-100/90 text-sm font-semibold uppercase tracking-wide mb-2">Total de Vendas</p>
                  <p className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                    {salesData.summary.total_sales}
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {/* Sales by User */}
          <div className="card group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Vendas por Funcionário
              </h2>
              <span className="text-sm text-slate-500 font-semibold">{getPeriodLabel(period)}</span>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Carregando dados...</p>
              </div>
            ) : salesData && salesData.users.length > 0 ? (
              <div className="space-y-4">
                {salesData.users.map((user: any, index: number) => {
                  const percentage =
                    salesData.summary.total_revenue > 0
                      ? (user.total_revenue / salesData.summary.total_revenue) * 100
                      : 0;
                  return (
                    <div 
                      key={user.user_id} 
                      className="border-2 border-slate-200 rounded-xl p-5 bg-gradient-to-r from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{user.full_name}</h3>
                          <p className="text-sm text-slate-600 font-medium">@{user.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(user.total_revenue)}
                          </p>
                          <p className="text-sm text-slate-600 font-semibold">{user.total_sales} vendas</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 mb-3 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 font-semibold">
                        <span>{percentage.toFixed(1)}% da receita total</span>
                        <span>Ticket médio: {formatCurrency(user.avg_sale)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma venda encontrada no período selecionado</p>
              </div>
            )}
          </div>

          {/* Top Sellers */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Ranking de Vendedores ({getPeriodLabel(period)})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Carregando dados...</p>
              </div>
            ) : topSellers && topSellers.top_sellers.length > 0 ? (
              <div className="space-y-3">
                {topSellers.top_sellers.map((seller: any) => {
                  const medalColors: { [key: number]: string } = {
                    1: "from-yellow-400 to-yellow-600",
                    2: "from-slate-300 to-slate-500",
                    3: "from-orange-400 to-orange-600",
                  };
                  const medalColor = medalColors[seller.rank] || "from-blue-400 to-blue-600";

                  return (
                    <div
                      key={seller.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                        seller.rank <= 3
                          ? "bg-gradient-to-r " + medalColor + " border-transparent text-white"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          seller.rank <= 3
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {seller.rank <= 3 ? "🏆" : seller.rank}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            seller.rank <= 3 ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {seller.full_name}
                        </h3>
                        <p
                          className={`text-sm ${
                            seller.rank <= 3 ? "text-white/80" : "text-slate-600"
                          }`}
                        >
                          {seller.total_sales} vendas
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            seller.rank <= 3 ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {formatCurrency(seller.total_revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum vendedor encontrado no período selecionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods and Sales by User with Tax */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Payment Method */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Vendas por Método de Pagamento ({getPeriodLabel(period)})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Carregando dados...</p>
              </div>
            ) : paymentMethodData && paymentMethodData.payment_methods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethodData.payment_methods.map((method: any) => {
                  const methodIcons: { [key: string]: any } = {
                    CASH: DollarSign,
                    CARD: CreditCard,
                    TRANSFER: Receipt,
                  };
                  const Icon = methodIcons[method.method] || CreditCard;
                  const methodColors: { [key: string]: string } = {
                    CASH: "from-green-500 to-green-600",
                    CARD: "from-blue-500 to-blue-600",
                    TRANSFER: "from-purple-500 to-purple-600",
                  };
                  const methodColor = methodColors[method.method] || "from-slate-500 to-slate-600";

                  return (
                    <div key={method.method} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${methodColor} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{method.method_display}</h3>
                            <p className="text-sm text-slate-600">{method.count} transações</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(method.total_amount)}
                          </p>
                          <p className="text-sm text-slate-600">{method.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className={`bg-gradient-to-r ${methodColor} h-2.5 rounded-full transition-all`}
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {paymentMethodData.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Receita:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(paymentMethodData.summary.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-600">Total Imposto:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(paymentMethodData.summary.total_tax)} ({paymentMethodData.summary.tax_percentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum pagamento encontrado no período selecionado</p>
              </div>
            )}
          </div>

          {/* Sales by User with Tax Breakdown */}
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Vendas por Funcionário com Impostos ({getPeriodLabel(period)})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Carregando dados...</p>
              </div>
            ) : salesDataWithTax && salesDataWithTax.users.length > 0 ? (
              <div className="space-y-4">
                {salesDataWithTax.users.map((user: any) => {
                  const percentage =
                    salesDataWithTax.summary.total_revenue > 0
                      ? (user.total_revenue / salesDataWithTax.summary.total_revenue) * 100
                      : 0;
                  return (
                    <div key={user.user_id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                          <p className="text-sm text-slate-600">@{user.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(user.total_revenue)}
                          </p>
                          <p className="text-sm text-slate-600">{user.total_sales} vendas</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(user.total_subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Imposto:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(user.total_tax)} ({user.tax_percentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{percentage.toFixed(1)}% da receita total</span>
                        <span>Ticket médio: {formatCurrency(user.avg_sale)}</span>
                      </div>
                    </div>
                  );
                })}
                {salesDataWithTax.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 mb-2">Resumo Total</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal Total:</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(salesDataWithTax.summary.total_subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Imposto Total:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(salesDataWithTax.summary.total_tax)} ({salesDataWithTax.summary.tax_percentage.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="font-semibold text-slate-900">Receita Total:</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(salesDataWithTax.summary.total_revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma venda encontrada no período selecionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

