import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";

const AdminSchedules = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    route: "",
    date: "",
    time: "",
    price: 0,
  });

  const { data: routes } = useQuery({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes;
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["admin-schedules"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      return data.schedules;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return await api.put(`/schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
    },
  });

  const openModal = (schedule?: any) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        route: schedule.route._id,
        date: new Date(schedule.date).toISOString().split("T")[0],
        time: schedule.time,
        price: schedule.price,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        route: "",
        date: "",
        time: "",
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet horaire ?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Horaires</h1>
        <button
          onClick={() => openModal()}
          className="bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="size-5" />
          Nouvel horaire
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
                  Trajet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Places dispo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules?.map((schedule: any) => (
                <tr key={schedule._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {schedule.route?.departure} → {schedule.route?.destination}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(schedule.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4">{schedule.time}</td>
                  <td className="px-6 py-4">
                    {schedule.availableSeats}/{schedule.totalSeats}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {schedule.price.toLocaleString()} Ar
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        schedule.status === "scheduled"
                          ? "bg-green-100 text-green-800"
                          : schedule.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : schedule.status === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(schedule)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="size-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule._id)}
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
                {editingSchedule ? "Modifier l'horaire" : "Nouvel horaire"}
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
                <label className="block font-medium mb-1">Route</label>
                <select
                  value={formData.route}
                  onChange={(e) =>
                    setFormData({ ...formData, route: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Sélectionner une route</option>
                  {routes?.map((route: any) => (
                    <option key={route._id} value={route._id}>
                      {route.departure} → {route.destination}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Heure</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
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
                  {editingSchedule ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedules;
