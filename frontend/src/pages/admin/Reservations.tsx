import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Eye,
  Loader,
  Plus,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { buildFallbackConfig } from "../../config/seatLayouts";
import api from "../../lib/axios";

// ─── SeatMap dynamique — utilise seatConfig de l'horaire ─────────────────────
function SeatMap({
  schedule,
  selected,
  onToggle,
}: {
  schedule: any;
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const config =
    schedule?.seatConfig ?? buildFallbackConfig(schedule?.totalSeats ?? 16);
  const occupiedSeats: number[] = schedule?.occupiedSeats ?? [];

  // Calculer numCols depuis les col des sièges
  let numCols = 1;
  config.rows.forEach((row: any) => {
    row.seats.forEach((s: any) => {
      numCols = Math.max(numCols, s.col + 1);
    });
  });

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      {/* Légende */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-white border-2 border-gray-300 inline-block" />{" "}
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary inline-block" />{" "}
          Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-gray-200 inline-block" /> Occupé
        </span>
      </div>

      <div className="max-w-xs mx-auto space-y-2">
        {config.rows.map((row: any, ri: number) => {
          const isFirst = ri === 0;
          const isBench = row.isBackBench;
          const prevBench = config.rows[ri - 1]?.isBackBench;
          const showDivider = isBench && !prevBench && ri > 0;

          // Construire la grille de la rangée
          const cells: Array<{
            kind: "seat" | "aisle" | "empty";
            seatId?: number;
          }> = Array.from({ length: numCols }, () => ({
            kind: "empty" as const,
          }));

          row.seats.forEach((seat: any) => {
            const ci = Math.min(seat.col, numCols - 1);
            cells[ci] = { kind: "seat", seatId: seat.id };
          });

          // Cases vides entre le premier et le dernier siège → allée
          const seatCols = row.seats.map((s: any) =>
            Math.min(s.col, numCols - 1),
          );
          if (seatCols.length >= 2) {
            const minC = Math.min(...seatCols);
            const maxC = Math.max(...seatCols);
            for (let ci = minC + 1; ci < maxC; ci++) {
              if (cells[ci]!.kind === "empty") cells[ci] = { kind: "aisle" };
            }
          }

          return (
            <div key={ri}>
              {showDivider && (
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">
                    {row.label ?? "Banquette"}
                  </span>
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isFirst
                    ? `40px repeat(${numCols}, 1fr)`
                    : `repeat(${numCols}, 1fr)`,
                  gap: 6,
                  padding: isBench ? "3px 5px" : "0",
                  background: isBench ? "rgba(251,191,36,.06)" : "transparent",
                  borderRadius: isBench ? 8 : 0,
                  border: isBench ? "1px dashed rgba(251,191,36,.3)" : "none",
                }}
              >
                {/* Conducteur — rangée 0 */}
                {isFirst && (
                  <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                    <User size={14} className="text-white" />
                  </div>
                )}
                {cells.map((cell, ci) => {
                  if (cell.kind === "aisle") {
                    return (
                      <div
                        key={ci}
                        className="h-10 rounded-md flex items-center justify-center"
                        style={{
                          background: "rgba(254,249,195,.8)",
                          border: "1px dashed #fde047",
                        }}
                      >
                        <svg width="6" height="16" viewBox="0 0 6 16">
                          <path
                            d="M3 1v14"
                            stroke="#ca8a04"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray="2 2"
                          />
                        </svg>
                      </div>
                    );
                  }
                  if (cell.kind === "empty") {
                    return <div key={ci} className="h-10" />;
                  }
                  const id = cell.seatId!;
                  const occupied = occupiedSeats.includes(id);
                  const sel = selected.includes(id);
                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={occupied}
                      onClick={() => onToggle(id)}
                      title={`Siège ${id}`}
                      className={`h-10 rounded-lg border-2 text-xs font-bold transition-all ${
                        occupied
                          ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                          : sel
                            ? "bg-primary border-primary text-black shadow-sm shadow-primary/30"
                            : "bg-white border-gray-300 text-gray-600 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                      }`}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cities = ["Antananarivo", "Antsirabe", "Ambatolampy"];

// ─── Walk-in Modal (redesigned) ────────────────────────────────────────────────
function WalkInModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  // Step: "search" → "client" → "seats"
  const [step, setStep] = useState<"search" | "client" | "seats">("search");

  // Step 1 – search filters
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]!,
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  // Step 2 – client
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3 – seats
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch all upcoming schedules once
  const { data: allSchedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["admin-schedules-walkin"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      const now = new Date();
      return data.schedules.filter((s: any) => {
        if (s.status === "cancelled") return false;
        if (s.availableSeats <= 0) return false;
        const [h, m] = s.time.split(":").map(Number);
        const dep = new Date(s.date);
        dep.setHours(h!, m!, 0, 0);
        return dep > now;
      });
    },
  });

  // Derive filtered schedules from user selection
  const filteredSchedules = allSchedules.filter((s: any) => {
    const sDate = new Date(s.date).toISOString().split("T")[0];
    const matchDate = sDate === selectedDate;
    const matchDep = !departure || s.route?.departure === departure;
    const matchDest = !destination || s.route?.destination === destination;
    return matchDate && matchDep && matchDest;
  });

  // Unique available departures / destinations
  const availableDepartures: string[] = [
    ...new Set(
      allSchedules.map((s: any) => s.route?.departure).filter(Boolean),
    ),
  ];
  const availableDestinations: string[] = [
    ...new Set(
      allSchedules
        .filter((s: any) => !departure || s.route?.departure === departure)
        .map((s: any) => s.route?.destination)
        .filter(Boolean),
    ),
  ];

  const selectedSchedule = allSchedules.find(
    (s: any) => s._id === selectedScheduleId,
  );
  const totalPrice = selectedSeats.length * (selectedSchedule?.price || 0);

  const toggleSeat = (id: number) =>
    setSelectedSeats((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  // Quick date helpers
  const quickDates = [
    { label: "Aujourd'hui", offset: 0 },
    { label: "Demain", offset: 1 },
    { label: "Dans 2j", offset: 2 },
  ];
  const setQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]!);
    setSelectedScheduleId("");
    setSelectedSeats([]);
  };
  const todayStr = new Date().toISOString().split("T")[0]!;

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/reservations/walk-in", {
        name: name.trim(),
        phone: phone.trim() || undefined,
        scheduleId: selectedScheduleId,
        seats: selectedSeats,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules-walkin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-today-schedules"] });
      setSuccessMsg(data.message || "Réservation créée !");
    },
  });

  const steps = ["search", "client", "seats"] as const;
  const stepLabels = ["Voyage", "Client", "Sièges"];
  const currentIdx = steps.indexOf(step);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successMsg) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            Réservation créée !
          </h3>
          <p className="text-gray-500 text-sm mb-6">{successMsg}</p>
          <button
            onClick={onClose}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              Réservation au bureau
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Client se présentant physiquement
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center px-6 py-3 gap-2 shrink-0 bg-gray-50 border-b border-gray-100">
          {stepLabels.map((label, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`size-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-black"
                      : active
                        ? "border-primary text-primary bg-white"
                        : "border-gray-200 text-gray-400 bg-white"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${active ? "text-gray-900" : "text-gray-400"}`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 ${done ? "bg-primary" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* ── Step 1: Voyage search ── */}
          {step === "search" && (
            <div className="space-y-5">
              {/* Date picker */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Date du voyage
                </label>
                {/* Quick buttons */}
                <div className="flex gap-2 mb-2">
                  {quickDates.map(({ label, offset }) => {
                    const val = (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + offset);
                      return d.toISOString().split("T")[0]!;
                    })();
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setQuickDate(offset)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                          selectedDate === val
                            ? "border-primary bg-primary text-black"
                            : "border-gray-200 text-gray-500 hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedScheduleId("");
                    setSelectedSeats([]);
                  }}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Departure + Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Départ
                  </label>
                  <select
                    value={departure}
                    onChange={(e) => {
                      setDeparture(e.target.value);
                      setDestination("");
                      setSelectedScheduleId("");
                    }}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                  >
                    <option value="">Tous</option>
                    {availableDepartures.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Destination
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setSelectedScheduleId("");
                    }}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                  >
                    <option value="">Tous</option>
                    {availableDestinations.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Voyages disponibles
                  </label>
                  {filteredSchedules.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {filteredSchedules.length} résultat
                      {filteredSchedules.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loadingSchedules ? (
                  <div className="flex justify-center py-10">
                    <Loader size={24} className="animate-spin text-primary" />
                  </div>
                ) : filteredSchedules.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-3xl mb-2">🚌</div>
                    <p className="text-sm font-semibold text-gray-600">
                      Aucun voyage trouvé
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Essayez une autre date ou d'autres villes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredSchedules.map((s: any) => {
                      const isSelected = selectedScheduleId === s._id;
                      const occupancyPct = Math.round(
                        ((s.totalSeats - s.availableSeats) / s.totalSeats) *
                          100,
                      );
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSelectedScheduleId(s._id);
                            setSelectedSeats([]);
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                              : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                          }`}
                        >
                          {/* Time badge */}
                          <div
                            className={`shrink-0 w-14 text-center py-1.5 px-2 rounded-lg ${
                              isSelected
                                ? "bg-primary text-black"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <p className="text-lg font-black leading-none">
                              {s.time}
                            </p>
                          </div>

                          {/* Route + bar */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900">
                              {s.route?.departure} → {s.route?.destination}
                            </p>
                            {/* Occupancy bar */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    occupancyPct >= 90
                                      ? "bg-red-400"
                                      : occupancyPct >= 60
                                        ? "bg-amber-400"
                                        : "bg-emerald-400"
                                  }`}
                                  style={{ width: `${occupancyPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                {s.availableSeats} place
                                {s.availableSeats > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          {/* Price + check */}
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black text-primary">
                              {s.price.toLocaleString()} Ar
                            </p>
                            {isSelected && (
                              <div className="size-5 bg-primary rounded-full flex items-center justify-center mt-1 ml-auto">
                                <svg
                                  width="10"
                                  height="8"
                                  viewBox="0 0 10 8"
                                  fill="none"
                                >
                                  <path
                                    d="M1 4L3.5 6.5L9 1.5"
                                    stroke="black"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("client")}
                disabled={!selectedScheduleId}
                className="w-full py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {/* ── Step 2: Client info ── */}
          {step === "client" && (
            <div className="space-y-4">
              {/* Selected schedule recap */}
              {selectedSchedule && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedSchedule.route?.departure} →{" "}
                      {selectedSchedule.route?.destination}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(selectedSchedule.date).toLocaleDateString(
                        "fr-FR",
                      )}{" "}
                      à {selectedSchedule.time}
                      {" · "}
                      {selectedSchedule.availableSeats} places libres
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("search")}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Modifier
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nom du client <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Jean Rakoto"
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Téléphone{" "}
                  <span className="text-gray-400 normal-case font-normal">
                    (optionnel)
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="034 00 000 00"
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Si le client a déjà un compte, il sera retrouvé
                  automatiquement.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep("seats")}
                  disabled={!name.trim()}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Seats ── */}
          {step === "seats" && (
            <div className="space-y-4">
              {/* Recap */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client</span>
                  <span className="font-semibold text-gray-900">
                    {name}
                    {phone ? ` · ${phone}` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trajet</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSchedule?.route?.departure} →{" "}
                    {selectedSchedule?.route?.destination}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horaire</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedSchedule?.date).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    à {selectedSchedule?.time}
                  </span>
                </div>
              </div>

              <SeatMap
                schedule={selectedSchedule}
                selected={selectedSeats}
                onToggle={toggleSeat}
              />

              {/* Selected seats chips */}
              {selectedSeats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((id) => (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 bg-primary/10 text-black border border-primary/20 text-xs font-bold px-2.5 py-1.5 rounded-lg"
                    >
                      Siège {id}
                      <button
                        type="button"
                        onClick={() => toggleSeat(id)}
                        className="opacity-50 hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Total */}
              {selectedSeats.length > 0 && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Total ({selectedSeats.length} siège
                    {selectedSeats.length > 1 ? "s" : ""})
                  </span>
                  <span className="text-xl font-black text-primary">
                    {totalPrice.toLocaleString()} Ar
                  </span>
                </div>
              )}

              {/* Error */}
              {mutation.isError && (
                <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    {(mutation.error as any)?.response?.data?.message ||
                      "Une erreur est survenue"}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("client")}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={selectedSeats.length === 0 || mutation.isPending}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Valider la réservation"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminReservations page ──────────────────────────────────────────────
const AdminReservations = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showWalkIn, setShowWalkIn] = useState(false);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations", statusFilter],
    queryFn: async () => {
      const { data } = await api.get("/admin/reservations", {
        params: statusFilter !== "all" ? { status: statusFilter } : {},
      });
      return data.reservations;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/reservations/${id}/confirm`);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/reservations/${id}/cancel`);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const filteredReservations = reservations?.filter(
    (res: any) =>
      res.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      res.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      res.user?.phone?.includes(search),
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      confirmed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      cancelled: "Annulée",
      completed: "Terminée",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${map[status] ?? "bg-gray-100 text-gray-800"}`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Gérez toutes les réservations
          </p>
        </div>
        <button
          onClick={() => setShowWalkIn(true)}
          className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          Réservation au bureau
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Référence, nom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="cancelled">Annulées</option>
          <option value="completed">Terminées</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <Loader size={28} className="animate-spin text-primary" />
            <p className="text-gray-400 text-sm">Chargement...</p>
          </div>
        ) : !filteredReservations?.length ? (
          <div className="p-16 text-center">
            <p className="text-gray-400 text-sm">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Référence",
                    "Client",
                    "Trajet",
                    "Date",
                    "Sièges",
                    "Prix",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReservations?.map((reservation: any) => (
                  <tr
                    key={reservation._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {reservation.bookingReference}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-sm text-gray-900">
                        {reservation.user?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {reservation.user?.phone || reservation.user?.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {reservation.schedule?.route?.departure} →{" "}
                      {reservation.schedule?.route?.destination}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      <div>
                        {new Date(
                          reservation.schedule?.date,
                        ).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {reservation.schedule?.time}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {reservation.seats.map((s: number) => (
                          <span
                            key={s}
                            className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                      {reservation.totalPrice.toLocaleString()} Ar
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {statusBadge(reservation.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        {reservation.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                confirmMutation.mutate(reservation._id)
                              }
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Confirmer"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() =>
                                cancelMutation.mutate(reservation._id)
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Walk-in modal */}
      {showWalkIn && <WalkInModal onClose={() => setShowWalkIn(false)} />}
    </div>
  );
};

export default AdminReservations;
