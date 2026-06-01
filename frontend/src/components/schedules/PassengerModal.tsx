import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  Check,
  Clock,
  Mail,
  Phone,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";
import { OccupancyBar } from "../common";

interface Passenger {
  reservationId: string;
  bookingReference: string;
  status: "confirmed" | "pending" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded";
  seats: number[];
  totalPrice: number;
  user: { name: string; email: string; phone?: string };
  createdAt: string;
}

interface ScheduleInfo {
  id: string;
  time: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  route: { departure: string; destination: string };
  passengerCount?: number;
}

interface Props {
  schedule: ScheduleInfo;
  onClose: () => void;
}

export function PassengerModal({ schedule, onClose }: Props) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["passengers", schedule.id],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/schedules/${schedule.id}/passengers`,
      );
      return data;
    },
  });

  const summary = data?.summary;
  const allPassengers: Passenger[] = data?.passengers ?? [];

  const passengers = search.trim()
    ? allPassengers.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.user.name.toLowerCase().includes(q) ||
          p.user.email.toLowerCase().includes(q) ||
          (p.user.phone?.includes(q) ?? false) ||
          p.bookingReference.toLowerCase().includes(q) ||
          p.seats.some((s) => String(s).includes(q))
        );
      })
    : allPassengers;

  const occupiedCount =
    schedule.passengerCount ?? schedule.totalSeats - schedule.availableSeats;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-gray-900 text-white p-4 sm:p-6 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">
                <Bus size={12} />
                <span>Manifeste passagers</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{schedule.route.departure}</span>
                <ArrowRight size={16} className="text-primary shrink-0" />
                <span className="truncate">{schedule.route.destination}</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {new Date(schedule.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {schedule.time}
              </p>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 ml-2"
            >
              <X size={16} />
            </button>
          </div>
          <OccupancyBar value={occupiedCount} max={schedule.totalSeats} />
        </div>

        {/* Summary chips */}
        {summary && (
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Check size={11} /> {summary.confirmed} confirmés
            </div>
            {summary.pending > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <Clock size={11} /> {summary.pending} en attente
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <TrendingUp size={11} /> {(summary.revenue ?? 0).toLocaleString()}{" "}
              Ar
            </div>
          </div>
        )}

        {/* Search */}
        {allPassengers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, siège, référence…"
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="size-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Chargement…</p>
            </div>
          ) : passengers.length === 0 ? (
            <div className="text-center py-12">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun passager</p>
            </div>
          ) : (
            passengers.map((p, index) => (
              <div
                key={p.reservationId}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                <div className="size-7 sm:size-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {p.user.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${p.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {p.status === "confirmed" ? "Confirmé" : "En attente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {p.user.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {p.user.phone}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <Mail size={10} />
                        {p.user.email.includes("@cotram.local")
                          ? "Walk-in"
                          : p.user.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex gap-1 flex-wrap justify-end max-w-[72px]">
                    {p.seats.map((s) => (
                      <span
                        key={s}
                        className="size-5 sm:size-6 rounded bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center"
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

        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">
            {search
              ? `${passengers.length} résultat${passengers.length > 1 ? "s" : ""}`
              : `${allPassengers.length} passager${allPassengers.length > 1 ? "s" : ""}`}
          </p>
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
