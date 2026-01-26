import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";

const AdminRoutes = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [formData, setFormData] = useState({
    departure: "",
    destination: "",
    duration: "",
    distance: 0,
    price: 0,
  });

  const { data: routes, isLoading } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/routes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return await api.put(`/routes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });

  const openModal = (route?: any) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        departure: route.departure,
        destination: route.destination,
        duration: route.duration,
        distance: route.distance,
        price: route.price,
      });
    } else {
      setEditingRoute(null);
      setFormData({
        departure: "",
        destination: "",
        duration: "",
        distance: 0,
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
    setFormData({
      departure: "",
      destination: "",
      duration: "",
      distance: 0,
      price: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce trajet ?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Routes</h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="size-5" />
          Nouvelle route
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Départ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {routes?.map((route: any) => (
                <tr key={route._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{route.departure}</td>
                  <td className="px-6 py-4">{route.destination}</td>
                  <td className="px-6 py-4">{route.duration}</td>
                  <td className="px-6 py-4">{route.distance} km</td>
                  <td className="px-6 py-4 font-semibold">
                    {route.price.toLocaleString()} Ar
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(route)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="size-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(route._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingRoute ? "Modifier la route" : "Nouvelle route"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Départ</label>
                <select
                  value={formData.departure}
                  onChange={(e) =>
                    setFormData({ ...formData, departure: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Antananarivo">Antananarivo</option>
                  <option value="Antsirabe">Antsirabe</option>
                  <option value="Ambatolampy">Ambatolampy</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Destination</label>
                <select
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Antananarivo">Antananarivo</option>
                  <option value="Antsirabe">Antsirabe</option>
                  <option value="Ambatolampy">Ambatolampy</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Durée</label>
                <input
                  type="text"
                  placeholder="5h 30min"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Distance (km)</label>
                <input
                  type="number"
                  value={formData.distance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distance: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Prix (Ar)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90"
                >
                  {editingRoute ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;
