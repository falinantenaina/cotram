import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, Trash2, Users } from "lucide-react";
import { useState } from "react";
import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../../components/common";
import api from "../../lib/axios";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "driver";
  isEmailVerified: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  user: { label: "Utilisateur", cls: "bg-gray-100 text-gray-600" },
  driver: { label: "Chauffeur", cls: "bg-blue-100 text-blue-700" },
  admin: { label: "Admin", cls: "bg-purple-100 text-purple-700" },
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data.users as User[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      api.put(`/users/${id}`, { role }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteId(null);
    },
  });

  const totalUsers = users?.length ?? 0;
  const admins = users?.filter((u) => u.role === "admin").length ?? 0;
  const verified = users?.filter((u) => u.isEmailVerified).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${totalUsers} compte${totalUsers !== 1 ? "s" : ""} enregistré${totalUsers !== 1 ? "s" : ""}`}
      />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: totalUsers, cls: "text-gray-900" },
            { label: "Admins", value: admins, cls: "text-purple-600" },
            {
              label: "Email vérifié",
              value: verified,
              cls: "text-emerald-600",
            },
          ].map(({ label, value, cls }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center"
            >
              <p className={`text-2xl font-black ${cls}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : !users?.length ? (
          <EmptyState icon={Users} title="Aucun utilisateur" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Utilisateur",
                      "Téléphone",
                      "Rôle",
                      "Email vérifié",
                      "Inscrit le",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => {
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
                              {user.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {user.phone || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                id: user._id,
                                role: e.target.value,
                              })
                            }
                            className="text-xs font-semibold border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="driver">Chauffeur</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          {user.isEmailVerified ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                              <ShieldCheck size={15} /> Vérifié
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Shield size={15} /> Non vérifié
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setDeleteId(user._id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {users.map((user) => {
                const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;
                return (
                  <div
                    key={user._id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-black font-bold shrink-0">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-gray-400">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteId(user._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleInfo.cls}`}
                        >
                          {roleInfo.label}
                        </span>
                        {user.isEmailVerified ? (
                          <ShieldCheck size={14} className="text-emerald-500" />
                        ) : (
                          <Shield size={14} className="text-gray-300" />
                        )}
                      </div>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({
                            id: user._id,
                            role: e.target.value,
                          })
                        }
                        className="text-xs border border-gray-200 rounded-lg py-1 px-2 focus:outline-none bg-white"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="driver">Chauffeur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {deleteId && (
        <ConfirmDeleteModal
          title="Supprimer cet utilisateur ?"
          description="Cette action est irréversible. Les données seront perdues."
          icon={Trash2}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onClose={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
