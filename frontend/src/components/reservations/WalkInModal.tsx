import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  Loader,
  Printer,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { buildFallbackConfig } from "../../config/seatLayouts";
import api from "../../lib/axios";

type PaperSize = "80" | "53";

// ─── Mini SeatMap ─────────────────────────────────────────────────────────────
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

  let numCols = 1;
  config.rows.forEach((row: any) =>
    row.seats.forEach((s: any) => {
      numCols = Math.max(numCols, s.col + 1);
    }),
  );

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
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
      <div className="max-w-xs mx-auto space-y-1.5">
        {config.rows.map((row: any, ri: number) => {
          const isFirst = ri === 0;
          const cells: Array<{
            kind: "seat" | "aisle" | "empty";
            seatId?: number;
          }> = Array.from({ length: numCols }, () => ({
            kind: "empty" as const,
          }));
          row.seats.forEach((seat: any) => {
            cells[Math.min(seat.col, numCols - 1)] = {
              kind: "seat",
              seatId: seat.id,
            };
          });
          const seatCols = row.seats.map((s: any) =>
            Math.min(s.col, numCols - 1),
          );
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
                <div className="h-9 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <User size={13} className="text-white" />
                </div>
              )}
              {cells.map((cell, ci) => {
                if (cell.kind === "aisle")
                  return (
                    <div
                      key={ci}
                      className="h-9 rounded-md flex items-center justify-center"
                      style={{
                        background: "rgba(254,249,195,.8)",
                        border: "1px dashed #fde047",
                      }}
                    >
                      <span className="text-yellow-600 text-xs">|</span>
                    </div>
                  );
                if (cell.kind === "empty")
                  return <div key={ci} className="h-9" />;
                const id = cell.seatId!;
                const occupied = occupiedSeats.includes(id);
                const sel = selected.includes(id);
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={occupied}
                    onClick={() => onToggle(id)}
                    className={`h-9 rounded-lg border-2 text-xs font-bold transition-all ${occupied ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed" : sel ? "bg-primary border-primary text-black shadow-sm" : "bg-white border-gray-300 text-gray-600 hover:border-primary/50 hover:bg-primary/5"}`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WalkInModal ──────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

const STEPS = ["search", "client", "seats"] as const;
const STEP_LABELS = ["Voyage", "Client", "Sièges"];

export function WalkInModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<(typeof STEPS)[number]>("search");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]!,
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [reservationData, setReservationData] = useState<any>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>("80");

  const todayStr = new Date().toISOString().split("T")[0]!;
  const currentIdx = STEPS.indexOf(step);

  const { data: allSchedules = [], isLoading } = useQuery({
    queryKey: ["admin-schedules-walkin"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      const now = new Date();
      return data.schedules.filter((s: any) => {
        if (s.status === "cancelled" || s.availableSeats <= 0) return false;
        const [h, m] = s.time.split(":").map(Number);
        const dep = new Date(s.date);
        dep.setHours(h!, m!, 0, 0);
        return dep > now;
      });
    },
  });

  const filteredSchedules = allSchedules.filter((s: any) => {
    const sDate = new Date(s.date).toISOString().split("T")[0];
    return (
      sDate === selectedDate &&
      (!departure || s.route?.departure?.name === departure) &&
      (!destination || s.route?.destination?.name === destination)
    );
  });

  const availableDepartures: string[] = [
    ...new Set(
      allSchedules.map((s: any) => s.route?.departure?.name).filter(Boolean),
    ),
  ] as string[];
  const availableDestinations: string[] = [
    ...new Set(
      allSchedules
        .filter((s: any) => !departure || s.route?.departure?.name === departure)
        .map((s: any) => s.route?.destination?.name)
        .filter(Boolean),
    ),
  ] as string[];

  const selectedSchedule = allSchedules.find(
    (s: any) => s.id === selectedScheduleId,
  );
  const totalPrice = selectedSeats.length * (selectedSchedule?.price || 0);
  const toggleSeat = (id: number) =>
    setSelectedSeats((p) =>
      p.includes(id) ? p.filter((s) => s !== id) : [...p, id],
    );

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
      setReservationData(data.reservation);
      setSuccessMsg(data.message || "Réservation créée !");
    },
  });

  const quickDates = [
    { label: "Aujourd'hui", offset: 0 },
    { label: "Demain", offset: 1 },
    { label: "Dans 2j", offset: 2 },
  ];

  if (successMsg) {
    const r = reservationData;
    const depName =
      r?.schedule?.route?.departure?.name ?? r?.schedule?.route?.departure ?? "—";
    const destName =
      r?.schedule?.route?.destination?.name ?? r?.schedule?.route?.destination ?? "—";
    const depDate = r?.schedule?.date
      ? new Date(r.schedule.date)
      : new Date();
    const seatNumbers = r?.seats?.map((s: any) => s.seatNumber ?? s) ?? [];
    const sep = "=".repeat(paperSize === "80" ? 32 : 20);
    const thinSep = "-".repeat(paperSize === "80" ? 32 : 20);

    const handlePrint = () => window.print();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">Réservation créée</h3>
                <p className="text-xs text-gray-400">
                  Référence {r?.bookingReference}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X size={18} />
            </button>
          </div>

          {/* Boarding pass */}
          <div className="overflow-y-auto flex-1 p-4 print:p-0">
            <div className="mx-auto print:mx-0" style={{ maxWidth: paperSize === "80" ? "300px" : "200px" }}>
              <pre className="font-mono text-[11px] leading-tight bg-white border border-gray-200 rounded-xl p-3 print:border-black print:rounded-none print:p-2 overflow-x-auto whitespace-pre-wrap break-words">
{`╔${sep}╗
║           COTRAM - BILLET DE VOYAGE           ║
║       Transport Interurbain - Madagascar       ║
╚${sep}╝

${thinSep}
  ${depName.toUpperCase().substring(0, 12)}  →  ${destName.toUpperCase().substring(0, 12)}
${thinSep}

  DATE      : ${depDate.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
  HEURE     : ${r?.schedule?.time ?? "—"}
  PASSAGER  : ${r?.user?.name?.substring(0, 20) ?? name.substring(0, 20)}
  SIEGES    : ${seatNumbers.join(", ")}
  STATUT    : CONFIRMEE

${thinSep}
  REFERENCE : ${r?.bookingReference ?? "—"}
  TOTAL     : ${(r?.totalPrice ?? 0).toLocaleString()} Ar
${thinSep}

  ⚠ Présentez-vous 15 min avant le départ
  ⚠ Munissez-vous d'un pièce d'identité

╔${sep}╗
║          COTRAM — Antananarivo • Antsirabe     ║
╚${sep}╝`}
              </pre>
            </div>

            {/* Actions - hidden on print */}
            <div className="flex gap-3 mt-4 print:hidden">
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white font-medium text-gray-700"
              >
                <option value="80">80mm</option>
                <option value="53">53mm</option>
              </select>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Printer size={14} />
                Imprimer le billet
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Print styles */}
          <style>{`
            @media print {
              @page {
                margin: 2mm;
                width: ${paperSize === "80" ? "80mm" : "53mm"};
              }
              * { box-shadow: none !important; text-shadow: none !important; }
              body { margin: 0; padding: 0; background: white !important; }
              nav, footer, header, .print\\:hidden { display: none !important; }
              pre {
                font-family: "Courier New", "Consolas", monospace !important;
                font-size: ${paperSize === "80" ? "11px" : "9px"} !important;
                line-height: 1.3 !important;
                white-space: pre-wrap !important;
                word-break: break-word !important;
                border: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: ${paperSize === "80" ? "80mm" : "53mm"} !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-black text-gray-900">
            Réservation guichet
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center px-6 py-3 gap-2 shrink-0 bg-gray-50 border-b border-gray-100">
          {STEP_LABELS.map((label, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`size-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border-2 transition-all ${done ? "bg-primary border-primary text-black" : active ? "border-primary text-primary bg-white" : "border-gray-200 text-gray-400 bg-white"}`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${active ? "text-gray-900" : "text-gray-400"}`}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
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
          {/* Step 1: Search */}
          {step === "search" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Date du voyage
                </label>
                <div className="flex gap-2 mb-2">
                  {quickDates.map(({ label, offset }) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const val = d.toISOString().split("T")[0]!;
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          setSelectedDate(val);
                          setSelectedScheduleId("");
                          setSelectedSeats([]);
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${selectedDate === val ? "border-primary bg-primary text-black" : "border-gray-200 text-gray-500 hover:border-primary/40"}`}
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
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

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
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">Tous</option>
                    {availableDepartures.map((c: string) => (
                      <option key={c}>{c}</option>
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
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">Tous</option>
                    {availableDestinations.map((c: string) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

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
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader size={24} className="animate-spin text-primary" />
                  </div>
                ) : filteredSchedules.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-600">
                      Aucun voyage trouvé
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Essayez une autre date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredSchedules.map((s: any) => {
                      const isSelected = selectedScheduleId === s.id;
                      const occupancyPct = Math.round(
                        ((s.totalSeats - s.availableSeats) / s.totalSeats) *
                          100,
                      );
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedScheduleId(s.id);
                            setSelectedSeats([]);
                          }}
                          className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 text-left transition-all ${isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"}`}
                        >
                          <div
                            className={`shrink-0 w-14 text-center py-1.5 px-2 rounded-lg ${isSelected ? "bg-primary text-black" : "bg-gray-100 text-gray-700"}`}
                          >
                            <p className="text-lg font-black leading-none">
                              {s.time}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900">
                              {s.route?.departure?.name} → {s.route?.destination?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                                  style={{ width: `${occupancyPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">
                                {s.availableSeats} libre
                                {s.availableSeats > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-black text-primary">
                              {s.price.toLocaleString()} Ar
                            </p>
                            {isSelected && (
                              <div className="size-5 bg-primary rounded-full flex items-center justify-center mt-1 ml-auto">
                                <Check size={10} className="text-black" />
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
                className="w-full py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Step 2: Client */}
          {step === "client" && (
            <div className="space-y-4">
              {selectedSchedule && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedSchedule.route?.departure?.name} →{" "}
                      {selectedSchedule.route?.destination?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(selectedSchedule.date).toLocaleDateString(
                        "fr-FR",
                      )}{" "}
                      à {selectedSchedule.time} ·{" "}
                      {selectedSchedule.availableSeats} places
                    </p>
                  </div>
                  <button
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
                  placeholder="Jean Rakoto"
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("search")}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep("seats")}
                  disabled={!name.trim()}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Seats */}
          {step === "seats" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client</span>
                  <span className="font-semibold">
                    {name}
                    {phone ? ` · ${phone}` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trajet</span>
                  <span className="font-semibold">
                    {selectedSchedule?.route?.departure?.name} →{" "}
                    {selectedSchedule?.route?.destination?.name}
                  </span>
                </div>
              </div>
              <SeatMap
                schedule={selectedSchedule}
                selected={selectedSeats}
                onToggle={toggleSeat}
              />
              {selectedSeats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((id) => (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 bg-primary/10 text-black border border-primary/20 text-xs font-bold px-2.5 py-1.5 rounded-lg"
                    >
                      Siège {id}
                      <button onClick={() => toggleSeat(id)}>
                        <X size={11} className="opacity-50 hover:opacity-100" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              {mutation.isError && (
                <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    {(mutation.error as any)?.response?.data?.message ||
                      "Erreur"}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("client")}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={selectedSeats.length === 0 || mutation.isPending}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-primary/90 flex items-center justify-center gap-2"
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
