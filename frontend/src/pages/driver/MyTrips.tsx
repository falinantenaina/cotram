import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  Printer,
  Users,
} from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";
import { PassengerModal } from "../../components/schedules/PassengerModal";

interface TripSchedule {
  id: string;
  date: string;
  time: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  vehicleNumber: string | null;
  route: {
    departure: { name: string; id?: string };
    destination: { name: string; id?: string };
    duration: string;
  };
  _count: { reservations: number };
}

const FILTERS = [
  { key: "upcoming", label: "À venir" },
  { key: "completed", label: "Terminés" },
  { key: "cancelled", label: "Annulés" },
  { key: "all", label: "Tous" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Programmé", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En cours", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Terminé", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulé", cls: "bg-red-100 text-red-700" },
};

export default function MyTrips() {
  const [filter, setFilter] = useState<"upcoming" | "completed" | "cancelled" | "all">("upcoming");
  const [passengerTrip, setPassengerTrip] = useState<TripSchedule | null>(null);

  const { data: trips = [], isLoading } = useQuery<TripSchedule[]>({
    queryKey: ["driver-trips", filter],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/trips", { params: { filter } });
      return data.schedules;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Mes voyages
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Consultez vos trajets assignés
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-primary text-black"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Trips list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bus size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun voyage trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onShowPassengers={() => setPassengerTrip(trip)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {passengerTrip && (
        <PassengerModal
          schedule={{
            id: passengerTrip.id,
            time: passengerTrip.time,
            date: passengerTrip.date,
            totalSeats: passengerTrip.totalSeats,
            availableSeats: passengerTrip.availableSeats,
            route: {
              departure: {
                id: passengerTrip.route.departure.id ?? "",
                name: passengerTrip.route.departure.name,
              },
              destination: {
                id: passengerTrip.route.destination.id ?? "",
                name: passengerTrip.route.destination.name,
              },
            },
            passengerCount:
              passengerTrip.totalSeats - passengerTrip.availableSeats,
          }}
          endpoint={`/drivers/me/schedules/${passengerTrip.id}/passengers`}
          onClose={() => setPassengerTrip(null)}
        />
      )}
    </div>
  );
}

function TripCard({
  trip,
  onShowPassengers,
}: {
  trip: TripSchedule;
  onShowPassengers: () => void;
}) {
  const st = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.scheduled;
  const depDate = new Date(trip.date);
  const now = new Date();
  const isToday = depDate.toISOString().split("T")[0] === now.toISOString().split("T")[0];
  const isPast = depDate < now && trip.status !== "scheduled";
  const passengerSeats = trip.totalSeats - trip.availableSeats;
  const occupancyPct = Math.round((passengerSeats / trip.totalSeats) * 100);

  return (
    <div className={`relative px-4 sm:px-6 py-4 sm:py-5 pr-4 sm:pr-36 hover:bg-gray-50 transition-colors ${isPast ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Time */}
        <div className="text-center shrink-0 w-12 sm:w-14">
          <p className="text-lg sm:text-xl font-black text-gray-900">{trip.time}</p>
          <p className={`text-[10px] font-semibold rounded px-1 mt-0.5 ${isToday ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"}`}>
            {isToday
              ? "Aujourd'hui"
              : depDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>

        {/* Route + status + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center gap-1 font-bold text-gray-900 text-sm min-w-0">
              <MapPin size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">{trip.route.departure.name}</span>
              <ArrowRight size={12} className="text-gray-300 shrink-0" />
              <span className="truncate">{trip.route.destination.name}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
              {st.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {trip.route.duration}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {passengerSeats}/{trip.totalSeats} sièges
            </span>
            {trip.vehicleNumber && (
              <span className="flex items-center gap-1">
                <Bus size={11} />
                {trip.vehicleNumber}
              </span>
            )}
          </div>

          <div className="mt-3 max-w-xs">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {trip.availableSeats} place{trip.availableSeats !== 1 ? "s" : ""} libre{trip.availableSeats !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 sm:mt-0 sm:absolute sm:right-6 sm:top-5 flex-col sm:flex-row">
        <button
          onClick={onShowPassengers}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all"
          title="Voir les passagers et imprimer le plan"
        >
          <Users size={13} />
          Passagers
        </button>
        <button
          onClick={onShowPassengers}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all"
          title="Imprimer le plan des sièges"
        >
          <Printer size={13} />
          Plan
        </button>
      </div>
    </div>
  );
}
