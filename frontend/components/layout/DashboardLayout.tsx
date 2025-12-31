"use client";

import { useEffect, useState, useRef } from "react";
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
  const hasCheckedRefresh = useRef(false);

  useEffect(() => {
    // Detect page refresh on mount
    const detectRefresh = () => {
      if (hasCheckedRefresh.current) return;
      hasCheckedRefresh.current = true;

      if (typeof window !== "undefined") {
        try {
          // Check navigation type to detect refresh
          const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
          
          // If it's a reload/refresh (not initial navigation), clear everything
          if (navigation && (navigation.type === "reload" || navigation.type === "back_forward")) {
            // Clear all storage and cache
            authApi.logout();
            
            // Clear browser cache
            if ("caches" in window) {
              caches.keys().then((names) => {
                names.forEach((name) => {
                  caches.delete(name);
                });
              });
            }
            
            // Force redirect to login
            window.location.href = "/login";
            return;
          }
        } catch (e) {
          // Fallback: check if page was refreshed using sessionStorage
          const wasRefreshed = sessionStorage.getItem("page_refreshed");
          if (wasRefreshed === "true") {
            sessionStorage.removeItem("page_refreshed");
            authApi.logout();
            window.location.href = "/login";
            return;
          }
        }
      }
    };

    // Set flag before page unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem("page_refreshed", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    detectRefresh();

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

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
          <p className="mt-6 text-slate-600 font-semibold text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Sidebar userRole={user.role} userName={user.full_name} />
      <main className="flex-1 lg:ml-64 ml-0 p-4 sm:p-6 lg:p-8 animate-fade-in w-full">
        {children}
      </main>
    </div>
  );
}

