import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bus,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Ticket,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────
type Passenger = {
  reservationId: string;
  bookingReference: string;
  status: "confirmed" | "pending" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded";
  seats: number[];
  totalPrice: number;
  user: { name: string; email: string; phone?: string };
  createdAt: string;
};

type TodaySchedule = {
  _id: string;
  time: string;
  date: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number[];
  price: number;
  vehicle: string;
  route: { departure: string; destination: string };
  passengerCount: number;
  reservations: Passenger[];
};

type RecentReservation = {
  _id: string;
  bookingReference: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  seats: number[];
  createdAt: string;
  user: { name: string; email: string; phone?: string };
  schedule: {
    time: string;
    date: string;
    route: { departure: string; destination: string };
  };
};

type Stats = {
  todayReservations: number;
  totalUsers: number;
  activeRoutes: number;
  monthlyRevenue: number;
  pendingCount: number;
};

// ─── Passenger Modal ──────────────────────────────────────────────────────────
function PassengerModal({
  schedule,
  onClose,
}: {
  schedule: TodaySchedule;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["passengers", schedule._id],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/schedules/${schedule._id}/passengers`,
      );
      return data;
    },
  });

  const summary = data?.summary;
  const passengers: Passenger[] = data?.passengers ?? [];

  const occupancyPct =
    schedule.totalSeats > 0
      ? Math.round((schedule.passengerCount / schedule.totalSeats) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">
                <Bus size={12} />
                <span>Manifeste passagers</span>
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>{schedule.route.departure}</span>
                <ArrowRight size={16} className="text-yellow-400" />
                <span>{schedule.route.destination}</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {new Date(schedule.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {schedule.time} · {schedule.vehicle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{schedule.passengerCount} passagers</span>
              <span>
                {schedule.availableSeats} places libres · {occupancyPct}% rempli
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occupancyPct >= 90
                    ? "bg-red-400"
                    : occupancyPct >= 60
                      ? "bg-yellow-400"
                      : "bg-emerald-400"
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary chips */}
        {summary && (
          <div className="flex gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              {summary.confirmed} confirmés
            </div>
            {summary.pending > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <Clock size={11} />
                {summary.pending} en attente
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <CreditCard size={11} />
              {summary.revenue.toLocaleString()} Ar encaissés
            </div>
          </div>
        )}

        {/* Passenger list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="size-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Chargement...</p>
            </div>
          ) : passengers.length === 0 ? (
            <div className="text-center py-12">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun passager</p>
              <p className="text-gray-400 text-sm">
                Ce voyage n'a pas encore de réservations
              </p>
            </div>
          ) : (
            passengers.map((p, index) => (
              <div
                key={p.reservationId}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                {/* Index */}
                <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {p.user.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        p.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.status === "confirmed" ? "Confirmé" : "En attente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {p.user.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {p.user.phone}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <Mail size={10} />
                        {p.user.email.includes("@cotram.local")
                          ? "Walk-in (sans compte)"
                          : p.user.email}
                      </span>
                    )}
                    <span className="font-mono text-gray-300">
                      {p.bookingReference}
                    </span>
                  </div>
                </div>

                {/* Seats */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex gap-1">
                    {p.seats.map((s) => (
                      <span
                        key={s}
                        className="size-6 rounded bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    {p.totalPrice.toLocaleString()} Ar
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none mb-0.5">
          {value}
        </p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [selectedSchedule, setSelectedSchedule] =
    useState<TodaySchedule | null>(null);

  const { data: statsData } = useQuery<{ success: boolean } & Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data;
    },
    refetchInterval: 60_000,
  });

  const { data: todayData } = useQuery<{
    success: boolean;
    schedules: TodaySchedule[];
  }>({
    queryKey: ["admin-today-schedules"],
    queryFn: async () => {
      const { data } = await api.get("/admin/today-schedules");
      return data;
    },
    refetchInterval: 30_000,
  });

  const { data: recentData } = useQuery<{
    success: boolean;
    reservations: RecentReservation[];
  }>({
    queryKey: ["admin-recent-reservations"],
    queryFn: async () => {
      const { data } = await api.get("/admin/recent-reservations");
      return data;
    },
    refetchInterval: 30_000,
  });

  const todaySchedules = todayData?.schedules ?? [];
  const recentReservations = recentData?.reservations ?? [];
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Split into upcoming vs departed
  const upcomingSchedules = todaySchedules.filter((s) => s.time >= nowStr);
  const departedSchedules = todaySchedules.filter((s) => s.time < nowStr);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Réservations aujourd'hui"
            value={statsData?.todayReservations ?? "—"}
            icon={Ticket}
            accent="bg-yellow-100 text-yellow-700"
          />
          <StatCard
            label="Revenus du mois"
            value={
              statsData
                ? `${(statsData.monthlyRevenue / 1000).toFixed(0)}k Ar`
                : "—"
            }
            icon={TrendingUp}
            accent="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            label="Clients inscrits"
            value={statsData?.totalUsers ?? "—"}
            icon={Users}
            accent="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="En attente de confirmation"
            value={statsData?.pendingCount ?? "—"}
            icon={AlertCircle}
            accent="bg-red-100 text-red-700"
            sub={statsData?.pendingCount ? "À traiter" : undefined}
          />
        </div>

        {/* Today's schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <h2 className="font-bold text-gray-900">Voyages d'aujourd'hui</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                {todaySchedules.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Activity size={11} className="text-emerald-500" />
              <span>Mise à jour en direct</span>
            </div>
          </div>

          {todaySchedules.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bus size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                Aucun voyage aujourd'hui
              </p>
              <p className="text-gray-400 text-sm">
                Les voyages planifiés pour aujourd'hui apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Upcoming */}
              {upcomingSchedules.map((schedule) => {
                const occupancy = Math.round(
                  (schedule.passengerCount / schedule.totalSeats) * 100,
                );
                return (
                  <button
                    key={schedule._id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group text-left"
                  >
                    {/* Time */}
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xl font-black text-gray-900">
                        {schedule.time}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 rounded px-1">
                        À venir
                      </p>
                    </div>

                    {/* Route */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        {schedule.route.departure}
                        <ArrowRight
                          size={12}
                          className="text-gray-300 shrink-0"
                        />
                        {schedule.route.destination}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {schedule.vehicle}
                      </p>
                    </div>

                    {/* Occupancy */}
                    <div className="shrink-0 w-32 hidden sm:block">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{schedule.passengerCount} passagers</span>
                        <span>{occupancy}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancy >= 90
                              ? "bg-red-400"
                              : occupancy >= 60
                                ? "bg-yellow-400"
                                : "bg-emerald-400"
                          }`}
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>

                    {/* Seats count */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {schedule.availableSeats} libres
                      </p>
                      <p className="text-xs text-gray-400">
                        sur {schedule.totalSeats}
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
                    />
                  </button>
                );
              })}

              {/* Departed */}
              {departedSchedules.map((schedule) => {
                const occupancy = Math.round(
                  (schedule.passengerCount / schedule.totalSeats) * 100,
                );
                return (
                  <button
                    key={schedule._id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group text-left opacity-50"
                  >
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xl font-black text-gray-400">
                        {schedule.time}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold bg-gray-100 rounded px-1">
                        Parti
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-600 text-sm">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        {schedule.route.departure}
                        <ArrowRight
                          size={12}
                          className="text-gray-300 shrink-0"
                        />
                        {schedule.route.destination}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {schedule.vehicle}
                      </p>
                    </div>
                    <div className="shrink-0 w-32 hidden sm:block">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{schedule.passengerCount} passagers</span>
                        <span>{occupancy}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-300 rounded-full"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-500 text-sm">
                        {schedule.passengerCount} passagers
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent reservations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="font-bold text-gray-900">Réservations récentes</h2>
          </div>

          {recentReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aucune réservation
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReservations.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center gap-4 px-6 py-3.5"
                >
                  {/* Avatar */}
                  <div className="size-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                    {r.user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {r.user.name}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          r.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : r.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status === "confirmed"
                          ? "Confirmé"
                          : r.status === "pending"
                            ? "En attente"
                            : "Annulé"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {r.schedule.route.departure} →{" "}
                      {r.schedule.route.destination} ·{" "}
                      {new Date(r.schedule.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      à {r.schedule.time}
                    </p>
                  </div>

                  {/* Price + time */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {r.totalPrice.toLocaleString()} Ar
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Passenger modal */}
      {selectedSchedule && (
        <PassengerModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
}
