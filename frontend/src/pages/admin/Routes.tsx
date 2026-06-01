import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock, Edit, MapPin, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../../components/common";
import api from "../../lib/axios";

interface Route {
  id: string;
  departure: string;
  destination: string;
  duration: string;
  distance: number;
  price: number;
  isActive: boolean;
}

const CITIES = ["Antananarivo", "Antsirabe", "Ambatolampy"];
const EMPTY_FORM = {
  departure: "",
  destination: "",
  duration: "",
  distance: 0,
  price: 0,
};

function RouteModal({
  route,
  onClose,
  onSuccess,
}: {
  route: Route | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(
    route
      ? {
          departure: route.departure,
          destination: route.destination,
          duration: route.duration,
          distance: route.distance,
          price: route.price,
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (route) return api.put(`/routes/${route.id}`, form);
      return api.post("/routes", form);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const inp =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                {route ? "Modifier le trajet" : "Nouveau trajet"}
              </p>
              <h2 className="text-lg font-black">
                {route
                  ? `${route.departure} → ${route.destination}`
                  : "Créer une route"}
              </h2>
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
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Départ
              </label>
              <select
                value={form.departure}
                onChange={(e) =>
                  setForm({ ...form, departure: e.target.value })
                }
                className={inp}
              >
                <option value="">Sélectionner</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Destination
              </label>
              <select
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
                className={inp}
              >
                <option value="">Sélectionner</option>
                {CITIES.filter((c) => c !== form.departure).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Durée
            </label>
            <div className="relative">
              <Clock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="ex: 5h 30min"
                className={`${inp} pl-9`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Distance (km)
              </label>
              <input
                type="number"
                value={form.distance}
                onChange={(e) =>
                  setForm({ ...form, distance: Number(e.target.value) })
                }
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Prix (Ar)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className={inp}
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.departure ||
              !form.destination ||
              !form.duration ||
              mutation.isPending
            }
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {route ? "Sauvegarder" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoutes() {
  const queryClient = useQueryClient();
  const [modalRoute, setModalRoute] = useState<Route | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes as Route[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      setDeleteId(null);
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-routes"] });

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Routes"
        subtitle={`${routes?.length ?? 0} trajet${(routes?.length ?? 0) !== 1 ? "s" : ""} actif${(routes?.length ?? 0) !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={() => setModalRoute("new")}
            className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90"
          >
            <Plus size={15} /> Nouvelle route
          </button>
        }
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : !routes?.length ? (
          <EmptyState
            icon={MapPin}
            title="Aucune route configurée"
            description="Ajoutez les trajets disponibles"
            action={
              <button
                onClick={() => setModalRoute("new")}
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Plus size={15} /> Créer une route
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Trajet", "Durée", "Distance", "Prix", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routes.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {route.departure}
                          </span>
                          <ArrowRight size={14} className="text-gray-400" />
                          <span className="font-bold text-gray-900">
                            {route.destination}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" />{" "}
                        {route.duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {route.distance} km
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {route.price.toLocaleString()} Ar
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalRoute(route)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(route.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">
                          {route.departure} → {route.destination}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {route.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModalRoute(route)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(route.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      {route.distance} km
                    </span>
                    <span className="font-black text-primary">
                      {route.price.toLocaleString()} Ar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalRoute !== null && (
        <RouteModal
          route={modalRoute === "new" ? null : modalRoute}
          onClose={() => setModalRoute(null)}
          onSuccess={refresh}
        />
      )}
      {deleteId && (
        <ConfirmDeleteModal
          title="Supprimer ce trajet ?"
          description="Cette route sera définitivement supprimée."
          icon={Trash2}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onClose={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
