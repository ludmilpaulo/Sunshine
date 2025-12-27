"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetData, setResetData] = useState<{ uid: string; token: string; reset_url: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.requestPasswordReset(email);
      setSuccess(true);
      
      // In development mode, show the reset URL
      if (response.reset_url) {
        setResetData({
          uid: response.uid,
          token: response.token,
          reset_url: response.reset_url,
        });
        toast.success("Link de redefinição gerado! (Modo desenvolvimento)");
      } else {
        toast.success("Se o e-mail existir, um link de redefinição foi enviado.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao solicitar redefinição de senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Redefinir Senha
          </h1>
          <p className="text-slate-600">Digite seu e-mail para receber o link de redefinição</p>
        </div>

        {!success ? (
          <div className="card shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Digite seu e-mail"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </span>
                ) : (
                  "Enviar Link de Redefinição"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <div className="card shadow-xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Link Enviado!</h2>
              <p className="text-slate-600">
                Se o e-mail existir, um link de redefinição foi enviado.
              </p>
              
              {resetData && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Modo Desenvolvimento:</p>
                  <p className="text-xs text-blue-700 mb-3 break-all">{resetData.reset_url}</p>
                  <Link
                    href={`/reset-password?uid=${resetData.uid}&token=${resetData.token}`}
                    className="btn-primary text-sm py-2"
                  >
                    Ir para Redefinição
                  </Link>
                </div>
              )}

              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          © 2024 Sunshine POS. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

