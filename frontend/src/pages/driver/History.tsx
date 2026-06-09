import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

interface TripSchedule {
  id: string;
  date: string;
  time: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  vehicleNumber: string | null;
  route: {
    departure: { name: string };
    destination: { name: string };
    duration: string;
  };
  _count: { reservations: number };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  completed: { label: "Terminé", cls: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={12} /> },
  cancelled: { label: "Annulé", cls: "bg-red-100 text-red-700", icon: <XCircle size={12} /> },
};

export default function DriverHistory() {
  const { data: trips = [], isLoading } = useQuery<TripSchedule[]>({
    queryKey: ["driver-trips", "completed"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/trips", { params: { filter: "completed" } });
      return data.schedules;
    },
  });

  const { data: cancelledTrips = [] } = useQuery<TripSchedule[]>({
    queryKey: ["driver-trips", "cancelled"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/trips", { params: { filter: "cancelled" } });
      return data.schedules;
    },
  });

  const allTrips = [...trips, ...cancelledTrips].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Historique
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {trips.length} voyage{trips.length !== 1 ? "s" : ""} terminé{trips.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="size-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{trips.length}</p>
              <p className="text-xs text-gray-400 font-medium">Terminés</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="size-9 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{cancelledTrips.length}</p>
              <p className="text-xs text-gray-400 font-medium">Annulés</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allTrips.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun historique</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allTrips.map((trip) => {
                const st = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.completed;
                const depDate = new Date(trip.date);
                const passengers = trip._count.reservations;

                return (
                  <div key={trip.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors opacity-70">
                    <div className="flex items-center gap-4">
                      <div className="text-center shrink-0 w-14">
                        <p className="text-lg font-black text-gray-900">{trip.time}</p>
                        <p className="text-[10px] text-gray-400 bg-gray-100 rounded px-1 mt-0.5">
                          {depDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            <span>{trip.route.departure.name}</span>
                            <ArrowRight size={11} className="text-gray-300 shrink-0" />
                            <span>{trip.route.destination.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {passengers} passagers
                          </span>
                          <span className="flex items-center gap-1">
                            <Bus size={11} />
                            {trip.vehicleNumber || "—"}
                          </span>
                        </div>
                      </div>

                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
