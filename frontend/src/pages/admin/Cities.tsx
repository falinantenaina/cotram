import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, MapPin, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
} from "../../components/common";
import api from "../../lib/axios";

interface City {
  id: string;
  name: string;
  region: string | null;
  isActive: boolean;
}

const EMPTY_FORM = {
  name: "",
  region: "",
};

function CityModal({
  city,
  onClose,
  onSuccess,
}: {
  city: City | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(
    city
      ? {
          name: city.name,
          region: city.region || "",
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (city) return api.put(`/cities/${city.id}`, form);
      return api.post("/cities", form);
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
                {city ? "Modifier la ville" : "Nouvelle ville"}
              </p>
              <h2 className="text-lg font-black">
                {city ? city.name : "Ajouter une ville"}
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

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Nom de la ville *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Toamasina"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Région
            </label>
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="ex: Atsinanana"
              className={inp}
            />
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
            disabled={!form.name.trim() || mutation.isPending}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {city ? "Sauvegarder" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCities() {
  const queryClient = useQueryClient();
  const [modalCity, setModalCity] = useState<City | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: cities, isLoading } = useQuery({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data } = await api.get("/cities/all");
      return data.cities as City[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cities"] });
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? "Erreur lors de la suppression");
      setDeleteId(null);
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-cities"] });
    queryClient.invalidateQueries({ queryKey: ["cities"] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Villes"
        subtitle={`${cities?.length ?? 0} ville${(cities?.length ?? 0) !== 1 ? "s" : ""} configurée${(cities?.length ?? 0) !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={() => setModalCity("new")}
            className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90"
          >
            <Plus size={15} /> Nouvelle ville
          </button>
        }
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : !cities?.length ? (
          <EmptyState
            icon={MapPin}
            title="Aucune ville configurée"
            description="Ajoutez les villes disponibles pour vos trajets"
            action={
              <button
                onClick={() => setModalCity("new")}
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Plus size={15} /> Ajouter une ville
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
                    {["Ville", "Région", "Statut", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cities.map((city) => (
                    <tr
                      key={city.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MapPin size={14} className="text-primary" />
                          </div>
                          <span className="font-bold text-gray-900">
                            {city.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {city.region || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            city.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {city.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModalCity(city)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(city.id)}
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
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">
                          {city.name}
                        </p>
                        {city.region && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {city.region}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModalCity(city)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(city.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-50">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        city.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalCity !== null && (
        <CityModal
          city={modalCity === "new" ? null : modalCity}
          onClose={() => setModalCity(null)}
          onSuccess={refresh}
        />
      )}
      {deleteId && (
        <ConfirmDeleteModal
          title="Supprimer cette ville ?"
          description="Cette ville sera définitivement supprimée. Assurez-vous qu'aucune route n'utilise cette ville."
          icon={Trash2}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onClose={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
