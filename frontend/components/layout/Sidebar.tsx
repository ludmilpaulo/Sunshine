"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  QrCode,
  Printer,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface SidebarProps {
  userRole: "admin" | "manager" | "staff";
  userName: string;
}

const menuItems = {
  admin: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/staff", label: "Funcionários", icon: Users },
    { href: "/sales", label: "Vendas", icon: BarChart3 },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/test-scanner", label: "Testar Scanner", icon: QrCode },
    { href: "/test-printer", label: "Testar Impressora", icon: Printer },
    { href: "/settings", label: "Configurações", icon: Settings },
  ],
  manager: [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/sales", label: "Vendas", icon: BarChart3 },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/pos", label: "PDV", icon: ShoppingCart },
  ],
  staff: [
    { href: "/pos", label: "Ponto de Venda", icon: ShoppingCart },
    { href: "/products", label: "Produtos", icon: Package },
  ],
};

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = menuItems[userRole];

  const handleLogout = () => {
    authApi.logout();
    toast.success("Logout realizado com sucesso");
    router.push("/login");
  };

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-2xl border-r border-slate-700/50">
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Sunshine POS
            </h1>
            <p className="text-xs text-slate-400 font-medium">Sistema de Vendas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 transform scale-105"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:translate-x-1"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-blue-400"} transition-colors`} />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 capitalize font-medium">
              {userRole === "admin" ? "Administrador" : userRole === "manager" ? "Gerente" : "Funcionário"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-600/20 hover:text-red-300 border border-slate-700/50 hover:border-red-500/50 transition-all duration-300 font-semibold group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

