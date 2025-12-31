"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usersApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { User } from "@/lib/api";
import { Plus, Search, Edit, UserPlus, Shield, UserCheck, UserX } from "lucide-react";

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "staff" as "admin" | "manager" | "staff",
    operation_type: "SHOP" as "SHOP" | "SALON" | "STUDIO" | "BOTH",
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list(roleFilter || undefined, search);
      setUsers(data.results || data);
    } catch (error) {
      toast.error("Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await usersApi.update(editingUser.id, updateData);
        toast.success("Usuário atualizado");
      } else {
        if (!formData.password) {
          toast.error("Senha é obrigatória para novos usuários");
          return;
        }
        await usersApi.create(formData);
        toast.success("Usuário criado");
      }
      setShowAddModal(false);
      setEditingUser(null);
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "staff",
        operation_type: "SHOP",
        is_active: true,
      });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Falha ao salvar usuário");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "manager":
        return <UserCheck className="w-4 h-4" />;
      default:
        return <UserX className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Gerenciamento de Funcionários
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Gerencie funcionários, gerentes e administradores</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                username: "",
                email: "",
                first_name: "",
                last_name: "",
                password: "",
                role: "staff",
                operation_type: "SHOP",
                is_active: true,
              });
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar Funcionário
          </button>
        </div>

        <div className="card animate-slide-up">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuários por nome, email ou username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-semibold bg-white"
            >
              <option value="">Todas as Funções</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="staff">Funcionário</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0 animate-slide-up">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Usuário</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">E-mail</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Função</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Operação</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user, index) => (
                    <tr key={user.id} className="table-row animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-lg text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-500 font-medium">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-slate-700 font-medium">{user.email}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role === "admin" ? "Administrador" : user.role === "manager" ? "Gerente" : "Funcionário"}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="badge-purple">
                          {(user as any).operation_type === "SHOP" ? "Shop" : (user as any).operation_type === "SALON" ? "Salon" : (user as any).operation_type === "STUDIO" ? "Studio" : "Todos"}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        {user.is_active ? (
                          <span className="badge-success">Ativo</span>
                        ) : (
                          <span className="badge-warning">Inativo</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                username: user.username,
                                email: user.email,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                password: "",
                                role: user.role,
                                operation_type: (user as any).operation_type || "SHOP",
                                is_active: user.is_active,
                              });
                              setShowAddModal(true);
                            }}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-slide-up border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex-shrink-0">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingUser ? "Editar Usuário" : "Adicionar Funcionário"}
              </h2>
              <p className="text-slate-600 mt-1 text-sm">Preencha os dados do funcionário</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nome</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field"
                    placeholder="Primeiro nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Sobrenome</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field"
                    placeholder="Sobrenome"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Usuário *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  required
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Senha {editingUser ? "(deixe em branco para manter a atual)" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Função *</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as "admin" | "manager" | "staff";
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      // Auto-set operation_type for admin
                      operation_type: newRole === "admin" ? "BOTH" : formData.operation_type
                    });
                  }}
                  className="input-field font-semibold"
                  required
                >
                  <option value="staff">Funcionário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Operação *</label>
                <select
                  value={formData.operation_type}
                  onChange={(e) =>
                    setFormData({ ...formData, operation_type: e.target.value as "SHOP" | "SALON" | "STUDIO" | "BOTH" })
                  }
                  className="input-field font-semibold"
                  required
                  disabled={formData.role === "admin"}
                >
                  <option value="SHOP">Shop</option>
                  <option value="SALON">Salon</option>
                  <option value="STUDIO">Studio</option>
                  <option value="BOTH">Todos (Admin)</option>
                </select>
                {formData.role === "admin" && (
                  <p className="text-xs text-slate-500 mt-2 font-medium">Administradores têm acesso a todas as operações</p>
                )}
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label className="text-sm font-bold text-slate-700 cursor-pointer">Usuário Ativo</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingUser ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

