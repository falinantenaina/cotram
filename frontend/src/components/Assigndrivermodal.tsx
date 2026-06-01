// frontend/src/components/admin/AssignDriverModal.tsx
// Intégrer ce composant dans les cartes d'horaires pour assigner rapidement un chauffeur

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Hash, Loader, Search, User, X } from "lucide-react";
import { useState } from "react";
import api from "../lib/axios";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
}

interface Props {
  scheduleId: string;
  currentDriverId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  available: "Disponible",
  on_trip: "En voyage",
  off_duty: "Hors service",
  suspended: "Suspendu",
};

const STATUS_DOT: Record<string, string> = {
  available: "bg-emerald-400",
  on_trip: "bg-blue-400 animate-pulse",
  off_duty: "bg-amber-400",
  suspended: "bg-red-400",
};

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
];

function getColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

export function AssignDriverModal({
  scheduleId,
  currentDriverId,
  onClose,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(currentDriverId ?? "");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/schedules/${scheduleId}/assign-driver`, {
        driverId: selectedId || null,
        vehicleNumber: vehicleNumber || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const drivers = (data?.drivers ?? []).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.vehicleNumber.toLowerCase().includes(q)
    );
  });

  const selectedDriver = drivers.find((d) => d.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                Assignation
              </p>
              <h2 className="text-lg font-black">Assigner un chauffeur</h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher un chauffeur…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Driver list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* No driver option */}
            <button
              onClick={() => setSelectedId("")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                !selectedId
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500">Non assigné</p>
                <p className="text-xs text-gray-400">
                  Retirer le chauffeur actuel
                </p>
              </div>
              {!selectedId && (
                <Check size={14} className="text-primary shrink-0" />
              )}
            </button>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader size={18} className="animate-spin text-gray-300" />
              </div>
            ) : (
              drivers.map((d) => {
                const color = getColor(d.id);
                const isSelected = d.id === selectedId;
                const isUnavailable =
                  d.status !== "available" && d.id !== currentDriverId;

                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedId(d.id);
                      setVehicleNumber(d.vehicleNumber);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : isUnavailable
                          ? "border-gray-100 opacity-50 cursor-not-allowed"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                    disabled={isUnavailable && !isSelected}
                  >
                    <div
                      className={`size-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm shrink-0`}
                    >
                      {d.firstName[0]}
                      {d.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {d.firstName} {d.lastName}
                        </p>
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT[d.status]}`}
                        />
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {STATUS_LABEL[d.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                        <Hash size={9} /> {d.vehicleNumber}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Vehicle number override */}
          {selectedId && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Numéro véhicule (pour ce voyage)
              </label>
              <div className="relative">
                <Hash
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(e.target.value.toUpperCase())
                  }
                  placeholder={selectedDriver?.vehicleNumber ?? "1234 TA"}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Laisser vide pour utiliser le numéro par défaut du chauffeur
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {mutation.isPending ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
