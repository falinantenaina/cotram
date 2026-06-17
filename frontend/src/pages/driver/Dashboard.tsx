import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../lib/axios";

interface DriverStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  thisMonth: number;
}

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

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Programmé", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En cours", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Terminé", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Annulé", cls: "bg-red-100 text-red-700" },
};

export default function DriverDashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery<DriverStats>({
    queryKey: ["driver-stats"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/stats");
      return data.stats;
    },
  });

  const { data: trips = [], isLoading: loadingTrips } = useQuery<TripSchedule[]>({
    queryKey: ["driver-trips", "upcoming"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/trips", { params: { filter: "upcoming" } });
      return data.schedules;
    },
  });

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const todayTrips = trips.filter((t) => t.date.split("T")[0] === todayStr);
  const upcomingTrips = trips.filter((t) => t.date.split("T")[0] !== todayStr).slice(0, 5);

  const statCards = [
    { label: "Total voyages", value: stats?.total ?? "—", icon: Bus, accent: "bg-blue-100 text-blue-700" },
    { label: "À venir", value: stats?.upcoming ?? "—", icon: Clock, accent: "bg-amber-100 text-amber-700" },
    { label: "Ce mois-ci", value: stats?.thisMonth ?? "—", icon: TrendingUp, accent: "bg-emerald-100 text-emerald-700" },
    { label: "Annulés", value: stats?.cancelled ?? "—", icon: XCircle, accent: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {now.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`size-9 rounded-xl flex items-center justify-center ${s.accent}`}>
                  <s.icon size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                {loadingStats ? "—" : s.value}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today's trips */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                Aujourd'hui
              </h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                {todayTrips.length}
              </span>
            </div>
            <Link
              to="/driver/trips"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Voir tout →
            </Link>
          </div>

          {loadingTrips ? (
            <div className="flex justify-center py-12">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todayTrips.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bus size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun voyage aujourd'hui</p>
              <p className="text-gray-400 text-xs mt-1">Profitez de votre journée !</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayTrips.map((trip) => (
                <TripRow key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming trips */}
        {upcomingTrips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight size={16} className="text-gray-400" />
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                  Prochains voyages
                </h2>
              </div>
              <Link
                to="/driver/trips"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Voir tout →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingTrips.map((trip) => (
                <TripRow key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripRow({ trip }: { trip: TripSchedule }) {
  const st = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.scheduled;
  const depDate = new Date(trip.date);
  const isToday = depDate.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
  const passengers = trip._count.reservations;
  const occupancyPct = Math.round(((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100);

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-gray-50 transition-colors">
      <div className="text-center shrink-0 w-12 sm:w-14">
        <p className="text-lg sm:text-xl font-black text-gray-900">{trip.time}</p>
        <p className={`text-[9px] sm:text-[10px] font-semibold rounded px-1 ${isToday ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"}`}>
          {isToday ? "Aujourd'hui" : depDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
          <MapPin size={11} className="text-gray-400 shrink-0" />
          <span className="truncate">{trip.route.departure.name}</span>
          <ArrowRight size={11} className="text-gray-300 shrink-0" />
          <span className="truncate">{trip.route.destination.name}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {passengers} passager{passengers !== 1 ? "s" : ""} · {trip.route.duration}
        </p>
      </div>

      <div className="shrink-0 hidden sm:block w-24">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          {trip.availableSeats} libre{trip.availableSeats !== 1 ? "s" : ""}
        </p>
      </div>

      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
        {st.label}
      </span>
    </div>
  );
}
