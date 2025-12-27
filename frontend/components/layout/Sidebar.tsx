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
    <div className="h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Sunshine POS
        </h1>
        <p className="text-sm text-slate-400 mt-1">Sistema de Vendas</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 capitalize">
              {userRole === "admin" ? "Administrador" : userRole === "manager" ? "Gerente" : "Funcionário"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}

