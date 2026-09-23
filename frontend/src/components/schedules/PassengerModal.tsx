import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bus,
  Check,
  Clock,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Printer,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { buildFallbackConfig } from "../../config/seatLayouts";
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

interface ScheduleSeat {
  id: number;
  row: number;
  col: number;
}

interface ScheduleInfo {
  id: string;
  time: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  seatConfig?: {
    totalSeats: number;
    rows: { row: number; seats: ScheduleSeat[]; isBackBench?: boolean; label?: string }[];
  } | null;
  route: { departure: { id: string; name: string }; destination: { id: string; name: string } };
  passengerCount?: number;
}

interface Props {
  schedule: ScheduleInfo;
  onClose: () => void;
}

type ViewMode = "map" | "list";

function matchPassenger(p: Passenger, q: string): boolean {
  const query = q.toLowerCase();
  return (
    p.user.name.toLowerCase().includes(query) ||
    p.user.email.toLowerCase().includes(query) ||
    (p.user.phone?.includes(q) ?? false) ||
    p.bookingReference.toLowerCase().includes(query) ||
    p.seats.some((s) => String(s).includes(q))
  );
}

function countSeats(passengers: Passenger[]): number {
  return passengers.reduce((sum, p) => sum + p.seats.length, 0);
}

function SeatPlan({
  schedule,
  passengers,
  search,
}: {
  schedule: ScheduleInfo;
  passengers: Passenger[];
  search: string;
}) {
  const config =
    schedule.seatConfig ?? buildFallbackConfig(schedule.totalSeats ?? 16);

  const seatToPassenger = new Map<number, Passenger>();
  for (const p of passengers) {
    for (const s of p.seats) {
      seatToPassenger.set(s, p);
    }
  }

  let numCols = 1;
  config.rows.forEach((row) =>
    row.seats.forEach((s) => {
      numCols = Math.max(numCols, s.col + 1);
    }),
  );

  return (
    <div className="space-y-3 print:block">
      <div className="flex gap-4 text-xs text-gray-500 print:hidden">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-white border-2 border-gray-300 inline-block" />{" "}
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary border-2 border-primary inline-block" />{" "}
          Occupé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-100 border-2 border-amber-300 inline-block" />{" "}
          En attente
        </span>
      </div>

      <div className="max-w-sm mx-auto space-y-1.5">
        {config.rows.map((row, ri) => {
          const isFirst = ri === 0;
          const cells: Array<{
            kind: "seat" | "aisle" | "empty";
            seatId?: number;
          }> = Array.from({ length: numCols }, () => ({
            kind: "empty" as const,
          }));
          row.seats.forEach((seat) => {
            cells[Math.min(seat.col, numCols - 1)] = {
              kind: "seat",
              seatId: seat.id,
            };
          });
          const seatCols = row.seats.map((s) => Math.min(s.col, numCols - 1));
          if (seatCols.length >= 2) {
            const minC = Math.min(...seatCols),
              maxC = Math.max(...seatCols);
            for (let ci = minC + 1; ci < maxC; ci++) {
              if (cells[ci]!.kind === "empty") cells[ci] = { kind: "aisle" };
            }
          }

          return (
            <div
              key={ri}
              style={{
                display: "grid",
                gridTemplateColumns: isFirst
                  ? `40px repeat(${numCols}, 1fr)`
                  : `repeat(${numCols}, 1fr)`,
                gap: 5,
              }}
            >
              {isFirst && (
                <div className="h-12 w-10 rounded-lg bg-gray-800 flex items-center justify-center print:bg-gray-800 print:text-white">
                  <Bus size={13} className="text-white" />
                </div>
              )}
              {cells.map((cell, ci) => {
                if (cell.kind === "aisle")
                  return (
                    <div
                      key={ci}
                      className="h-12 rounded-md flex items-center justify-center"
                      style={{
                        background: "rgba(254,249,195,.8)",
                        border: "1px dashed #fde047",
                      }}
                    >
                      <span className="text-yellow-600 text-xs">|</span>
                    </div>
                  );
                if (cell.kind === "empty")
                  return <div key={ci} className="h-12" />;

                const id = cell.seatId!;
                const p = seatToPassenger.get(id);
                const isMatch =
                  !search.trim() || (p ? matchPassenger(p, search) : false);
                const pending = p?.status === "pending";

                if (!p) {
                  return (
                    <div
                      key={ci}
                      className={`h-12 rounded-lg border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center ${isMatch ? "" : "opacity-30"}`}
                    >
                      <span className="text-[10px] font-bold text-gray-400">
                        {id}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={ci}
                    title={`${p.user.name} — ${p.bookingReference}`}
                    className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center px-1 leading-tight transition-all ${
                      pending
                        ? "bg-amber-50 border-amber-300 text-amber-900"
                        : "bg-primary/15 border-primary text-gray-900"
                    } ${isMatch ? "" : "opacity-30"}`}
                  >
                    <span className="text-[10px] font-black">{id}</span>
                    <span className="text-[9px] font-bold truncate max-w-full text-center">
                      {p.user.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend / print header */}
      <div className="hidden print:block text-center text-xs mt-2">
        <p className="font-bold">
          {schedule.route.departure?.name} → {schedule.route.destination?.name}
        </p>
        <p>
          {new Date(schedule.date).toLocaleDateString("fr-FR")} ·{" "}
          {schedule.time} · {seatToPassenger.size}/
          {schedule.totalSeats} sièges occupés
        </p>
      </div>
    </div>
  );
}

export function PassengerModal({ schedule, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("map");

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
  const apiSchedule = data?.schedule;

  const effectiveSchedule: ScheduleInfo = {
    ...schedule,
    seatConfig: apiSchedule?.seatConfig ?? schedule.seatConfig ?? null,
  };

  const passengers = search.trim()
    ? allPassengers.filter((p) => matchPassenger(p, search))
    : allPassengers;

  const occupiedSeats = summary?.totalPassengers ?? countSeats(allPassengers);
  const occupiedCount =
    schedule.passengerCount ?? schedule.totalSeats - schedule.availableSeats;
  const displayOccupied = Math.max(occupiedCount, occupiedSeats);

  const handlePrint = () => {
    setView("map");
    setSearch("");
    requestAnimationFrame(() => {
      window.print();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:p-0 print:static print:block"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:rounded-none print:shadow-none print:relative print:w-full">
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 print:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-gray-900 text-white p-4 sm:p-6 shrink-0 print:bg-white print:text-black print:border-b print:border-gray-300 print:p-3">
          <div className="flex items-start justify-between mb-4 print:mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-widest mb-1 print:text-gray-600">
                <Bus size={12} />
                <span>Manifeste passagers</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-1.5 flex-wrap">
                <span className="truncate">
                  {schedule.route.departure?.name}
                </span>
                <ArrowRight
                  size={16}
                  className="text-primary shrink-0 print:text-black"
                />
                <span className="truncate">
                  {schedule.route.destination?.name}
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-1 print:text-gray-600">
                {new Date(schedule.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {schedule.time}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2 print:hidden">
              <button
                onClick={handlePrint}
                className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                title="Imprimer le plan"
              >
                <Printer size={16} />
              </button>
              <button
                onClick={onClose}
                className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="print:hidden">
            <OccupancyBar value={displayOccupied} max={schedule.totalSeats} />
          </div>
        </div>

        {/* Summary chips */}
        {summary && (
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0 print:hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Check size={11} /> {summary.confirmed} sièges confirmés
            </div>
            {summary.pending > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                <Clock size={11} /> {summary.pending} sièges en attente
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <TrendingUp size={11} /> {(summary.revenue ?? 0).toLocaleString()}{" "}
              Ar
            </div>
          </div>
        )}

        {/* Search + view toggle */}
        {allPassengers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 shrink-0 flex gap-2 print:hidden">
            <div className="relative flex-1">
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
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setView("map")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${view === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                title="Plan des sièges"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Plan</span>
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                title="Liste"
              >
                <List size={13} />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
        )}

        {/* Content — seat plan is always present for print */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-2 print:overflow-visible">
          {isLoading ? (
            <div className="flex flex-col items-center py-12 print:hidden">
              <div className="size-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Chargement…</p>
            </div>
          ) : allPassengers.length === 0 ? (
            <div className="text-center py-12 print:hidden">
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun passager</p>
            </div>
          ) : (
            <>
              {/* Always render seat plan — visible on screen in map view, always on print */}
              <div className={view === "map" ? "block print:block" : "hidden print:block"}>
                <SeatPlan
                  schedule={effectiveSchedule}
                  passengers={allPassengers}
                  search={view === "map" ? search : ""}
                />
              </div>

              {view === "list" && (
                <div className="space-y-2.5 print:hidden">
                  {passengers.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 font-medium">Aucun résultat</p>
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
                              {p.status === "confirmed"
                                ? "Confirmé"
                                : "En attente"}
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
              )}
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 print:hidden">
          <p className="text-xs text-gray-400">
            {search
              ? `${passengers.length} réservation${passengers.length > 1 ? "s" : ""} · ${countSeats(passengers)} siège${countSeats(passengers) > 1 ? "s" : ""}`
              : `${occupiedSeats} siège${occupiedSeats > 1 ? "s" : ""} occupé${occupiedSeats > 1 ? "s" : ""} sur ${schedule.totalSeats}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Printer size={14} />
              Imprimer le plan
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        <style>{`
          @media print {
            @page { margin: 8mm; }
            body * { visibility: visible; }
            nav, footer, .print\\:hidden { display: none !important; }
            .hidden.print\\:block { display: block !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
