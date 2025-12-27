"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "staff";
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);

        // Check role if required
        if (requiredRole) {
          if (requiredRole === "admin" && !userData.is_superuser) {
            router.push("/dashboard");
            return;
          }
          if (requiredRole === "manager" && !userData.is_staff) {
            router.push("/dashboard");
            return;
          }
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole={user.role} userName={user.full_name} />
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  );
}

