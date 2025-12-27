"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, Printer, Network, User } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-600 mt-1">Gerencie as configurações do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Configurações da Impressora</h2>
                <p className="text-sm text-slate-600">Configure a impressora de recibos</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              A configuração da impressora é gerenciada através do serviço Print Bridge.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Configurações de Rede</h2>
                <p className="text-sm text-slate-600">Configurações de API e conexão</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              As configurações de rede são configuradas via variáveis de ambiente.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Perfil do Usuário</h2>
                <p className="text-sm text-slate-600">Gerencie sua conta</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Gerenciamento de perfil de usuário em breve.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Configurações do Sistema</h2>
                <p className="text-sm text-slate-600">Configuração geral do sistema</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              As configurações do sistema são gerenciadas por administradores.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

