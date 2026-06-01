import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Eye, Loader, Plus, Search, XCircle } from "lucide-react";
import { useState } from "react";

import { LoadingSpinner, PageHeader } from "../../components/common";
import { WalkInModal } from "../../components/reservations/WalkInModal";
import api from "../../lib/axios";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmée", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annulée", cls: "bg-red-100 text-red-800" },
  completed: { label: "Terminée", cls: "bg-blue-100 text-blue-800" },
};

export default function AdminReservations() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showWalkIn, setShowWalkIn] = useState(false);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations", statusFilter],
    queryFn: async () => {
      const { data } = await api.get("/admin/reservations", {
        params: statusFilter !== "all" ? { status: statusFilter } : {},
      });
      return data.reservations;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/reservations/${id}/confirm`);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/reservations/${id}/cancel`);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const filteredReservations = reservations?.filter(
    (res: any) =>
      res.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      res.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      res.user?.phone?.includes(search),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Réservations"
        subtitle="Gérez toutes les réservations"
        actions={
          <button
            onClick={() => setShowWalkIn(true)}
            className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-all whitespace-nowrap"
          >
            <Plus size={18} />
            Réservation guichet
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Référence, nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmées</option>
            <option value="cancelled">Annulées</option>
            <option value="completed">Terminées</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : !filteredReservations?.length ? (
            <div className="p-16 text-center">
              <p className="text-gray-400 text-sm">
                Aucune réservation trouvée
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        "Référence",
                        "Client",
                        "Trajet",
                        "Date",
                        "Sièges",
                        "Prix",
                        "Statut",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReservations?.map((res: any) => {
                      const s =
                        STATUS_LABELS[res.status] ?? STATUS_LABELS.pending;
                      return (
                        <tr
                          key={res.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-4 font-mono text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {res.bookingReference}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-sm text-gray-900">
                              {res.user?.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {res.user?.phone || res.user?.email}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {res.schedule?.route?.departure} →{" "}
                            {res.schedule?.route?.destination}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            <div>
                              {new Date(res.schedule?.date).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {res.schedule?.time}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {res.seats.map((seat: number) => (
                                <span
                                  key={seat}
                                  className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                            {res.totalPrice.toLocaleString()} Ar
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${s.cls}`}
                            >
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              {res.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      confirmMutation.mutate(res.id)
                                    }
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                    title="Confirmer"
                                  >
                                    {confirmMutation.isPending ? (
                                      <Loader
                                        size={18}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <CheckCircle size={18} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      cancelMutation.mutate(res.id)
                                    }
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                    title="Annuler"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              <button
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filteredReservations?.map((res: any) => {
                  const s = STATUS_LABELS[res.status] ?? STATUS_LABELS.pending;
                  return (
                    <div key={res.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono font-bold text-sm text-gray-900">
                            {res.bookingReference}
                          </p>
                          <p className="font-semibold text-gray-900 mt-0.5">
                            {res.user?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {res.user?.phone || res.user?.email}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold">
                          {res.schedule?.route?.departure} →{" "}
                          {res.schedule?.route?.destination}
                        </span>
                        <span className="text-gray-400 mx-1">·</span>
                        {new Date(res.schedule?.date).toLocaleDateString(
                          "fr-FR",
                        )}{" "}
                        à {res.schedule?.time}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {res.seats.map((seat: number) => (
                            <span
                              key={seat}
                              className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {res.totalPrice.toLocaleString()} Ar
                        </span>
                      </div>
                      {res.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => confirmMutation.mutate(res.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
                          >
                            <CheckCircle size={14} /> Confirmer
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(res.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200"
                          >
                            <XCircle size={14} /> Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showWalkIn && <WalkInModal onClose={() => setShowWalkIn(false)} />}
    </div>
  );
}
