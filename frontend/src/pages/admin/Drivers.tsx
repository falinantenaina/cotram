import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";

import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../../components/common";
import {
  DriverCard,
  STATUS_CONFIG,
  type Driver,
} from "../../components/drivers/DriverCard";
import { DriverModal } from "../../components/drivers/DriverModal";
import { DriverPanel } from "../../components/drivers/DriverPanel";
import api from "../../lib/axios";

export default function AdminDrivers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<Driver | null | "new">(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setDeleteId(null);
    },
  });

  const drivers = (data?.drivers ?? []).filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.vehicleNumber.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: data?.drivers.length ?? 0,
    available:
      data?.drivers.filter((d) => d.status === "available").length ?? 0,
    on_trip: data?.drivers.filter((d) => d.status === "on_trip").length ?? 0,
    off_duty: data?.drivers.filter((d) => d.status === "off_duty").length ?? 0,
    suspended:
      data?.drivers.filter((d) => d.status === "suspended").length ?? 0,
  };

  const refreshDrivers = () =>
    queryClient.invalidateQueries({ queryKey: ["drivers"] });

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Chauffeurs"
        subtitle={`${counts.all} chauffeur${counts.all !== 1 ? "s" : ""} · ${counts.available} disponibles`}
        actions={
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all"
          >
            <Plus size={15} /> Nouveau chauffeur
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              key: "available",
              label: "Disponibles",
              accent: "bg-emerald-100 text-emerald-700",
            },
            {
              key: "on_trip",
              label: "En voyage",
              accent: "bg-blue-100 text-blue-700",
            },
            {
              key: "off_duty",
              label: "Hors service",
              accent: "bg-amber-100 text-amber-700",
            },
            {
              key: "suspended",
              label: "Suspendus",
              accent: "bg-red-100 text-red-700",
            },
          ].map(({ key, label, accent }) => (
            <StatCard
              key={key}
              label={label}
              value={counts[key as keyof typeof counts]}
              icon={() => null}
              accent={accent}
            />
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Chercher par nom, téléphone, immatriculation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {(
              ["all", "available", "on_trip", "off_duty", "suspended"] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <LoadingSpinner message="Chargement des chauffeurs…" />
        ) : drivers.length === 0 ? (
          <EmptyState
            icon={(() => null) as any}
            title="Aucun chauffeur trouvé"
            description="Commencez par enregistrer un chauffeur"
            action={
              <button
                onClick={() => setModal("new")}
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Plus size={15} /> Ajouter un chauffeur
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {drivers.map((d) => (
              <DriverCard
                key={d.id}
                driver={d}
                onEdit={() => setModal(d)}
                onDelete={() => setDeleteId(d.id)}
                onClick={() => setDetailDriver(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal !== null && (
        <DriverModal
          driver={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={refreshDrivers}
        />
      )}

      {detailDriver && !modal && (
        <DriverPanel
          driver={detailDriver}
          onEdit={() => {
            setModal(detailDriver);
            setDetailDriver(null);
          }}
          onClose={() => setDetailDriver(null)}
        />
      )}

      {deleteId && (
        <ConfirmDeleteModal
          title="Supprimer ce chauffeur ?"
          description="Il sera retiré de tous les voyages planifiés."
          icon={Trash2}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onClose={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
