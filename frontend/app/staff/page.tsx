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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Funcionários</h1>
            <p className="text-slate-600 mt-1">Gerencie funcionários, gerentes e administradores</p>
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

        <div className="card">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Usuário</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">E-mail</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Função</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role === "admin" ? "Administrador" : user.role === "manager" ? "Gerente" : "Funcionário"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {user.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
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
                                is_active: user.is_active,
                              });
                              setShowAddModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingUser ? "Editar Usuário" : "Adicionar Funcionário"}
            </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sobrenome</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Usuário *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha {editingUser ? "(deixe em branco para manter a atual)" : "*"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required={!editingUser}
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Função *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "admin" | "manager" | "staff" })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="staff">Funcionário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-slate-700">Ativo</label>
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

