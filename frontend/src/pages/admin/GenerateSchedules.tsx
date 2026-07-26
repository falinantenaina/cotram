import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Edit2,
  Loader,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { seatTemplateApi, type SeatTemplate } from "../../api/seatTemplateApi";
import { vehicleTemplateApi } from "../../api/vehicleTemplateApi";
import type { SeatConfig } from "../../config/seatLayouts";
import api from "../../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewItem {
  id: string;
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  time: string;
  price: number;
  vehicle: string;
  status: "new" | "exists" | "past";
  routeId: string;
}
interface EditableItem extends PreviewItem {
  excluded: boolean;
  edited: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMES_HOURLY = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 5).padStart(2, "0")}:00`,
);
const TIMES_HALF = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(((i + 10) * 30) / 60),
    m = ((i + 10) * 30) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}).filter((t) => {
  const h = parseInt(t);
  return h >= 5 && h <= 20;
});
const VEHICLES = ["Crafter", "Sprinter", "Transit"];
const DAY_COLORS: Record<string, string> = {
  Lundi: "bg-blue-100 text-blue-800",
  Mardi: "bg-purple-100 text-purple-800",
  Mercredi: "bg-emerald-100 text-emerald-800",
  Jeudi: "bg-amber-100 text-amber-800",
  Vendredi: "bg-orange-100 text-orange-800",
  Samedi: "bg-pink-100 text-pink-800",
  Dimanche: "bg-red-100 text-red-800",
};

function getPresetRange(preset: string): { start: string; end: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0]!;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  if (preset === "this-week") {
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: fmt(monday), end: fmt(sunday) };
  }
  if (preset === "next-week") {
    const sunday = new Date(nextMonday);
    sunday.setDate(nextMonday.getDate() + 6);
    return { start: fmt(nextMonday), end: fmt(sunday) };
  }
  if (preset === "next-2-weeks") {
    const end = new Date(nextMonday);
    end.setDate(nextMonday.getDate() + 13);
    return { start: fmt(nextMonday), end: fmt(end) };
  }
  const end = new Date(today);
  end.setMonth(today.getMonth() + 1);
  return { start: fmt(today), end: fmt(end) };
}

// ─── Step 1: Config ───────────────────────────────────────────────────────────
function ConfigStep({
  onNext,
}: {
  onNext: (cfg: {
    routeId: string;
    startDate: string;
    endDate: string;
    times: string[];
    price: number;
    vehicle: string;
    seatConfig: SeatConfig | null;
    seatTemplateId: string | null;
  }) => void;
}) {
  const [routeId, setRouteId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]!,
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0]!;
  });
  const [selectedTimes, setSelectedTimes] = useState<string[]>([
    "06:00",
    "08:00",
    "10:00",
  ]);
  const [timeMode, setTimeMode] = useState<"hourly" | "half">("hourly");
  const [price, setPrice] = useState<number | "">("");
  const [vehicle, setVehicle] = useState("Crafter");
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);
  const [templates, setTemplates] = useState<SeatTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingVehicleTemplate, setLoadingVehicleTemplate] = useState(false);

  useEffect(() => {
    seatTemplateApi.getAll().then(setTemplates);
  }, []);

  useEffect(() => {
    setLoadingVehicleTemplate(true);
    vehicleTemplateApi
      .getByType(vehicle)
      .then((tpl) => {
        if (tpl?.seatConfig) {
          setSeatConfig(tpl.seatConfig);
          setSelectedTemplateId("");
        }
      })
      .finally(() => setLoadingVehicleTemplate(false));
  }, [vehicle]);

  const { data: routesData } = useQuery({
    queryKey: ["routes-gen"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes as any[];
    },
  });

  const times = timeMode === "hourly" ? TIMES_HOURLY : TIMES_HALF;
  const selectedRoute = routesData?.find((r) => r.id === routeId);
  const dayCount =
    startDate && endDate && startDate <= endDate
      ? Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0;
  const canSubmit =
    routeId &&
    startDate &&
    endDate &&
    selectedTimes.length > 0 &&
    startDate <= endDate;

  return (
    <div className="space-y-6">
      {/* Route */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          1. Trajet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routesData?.map((route) => (
            <button
              key={route.id}
              onClick={() => {
                setRouteId(route.id);
                if (price === "") setPrice(route.price);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${routeId === route.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"}`}
            >
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {route.departure?.name}
                  <ArrowRight
                    size={13}
                    className="inline mx-1.5 text-gray-400"
                  />
                  {route.destination?.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {route.price?.toLocaleString()} Ar / siège
                </p>
              </div>
              {routeId === route.id && (
                <div className="size-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <Check size={12} className="text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          2. Période
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Cette semaine", key: "this-week" },
            { label: "Semaine prochaine", key: "next-week" },
            { label: "2 semaines", key: "next-2-weeks" },
            { label: "1 mois", key: "next-month" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => {
                const r = getPresetRange(p.key);
                setStartDate(r.start);
                setEndDate(r.end);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Du
            </label>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Au
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {dayCount > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            {dayCount} jour{dayCount > 1 ? "s" : ""} sélectionné
            {dayCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Times */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            3. Heures de départ
          </h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["hourly", "half"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTimeMode(mode);
                  setSelectedTimes([]);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  timeMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {mode === "hourly" ? "Par heure" : "30 min"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSelectedTimes([...times])}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tout sélectionner
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={() => setSelectedTimes([])}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            Tout effacer
          </button>
          {selectedTimes.length > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">
                {selectedTimes.length} heure
                {selectedTimes.length > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {times.map((t) => (
            <button
              key={t}
              onClick={() =>
                setSelectedTimes((p) =>
                  p.includes(t) ? p.filter((x) => x !== t) : [...p, t].sort(),
                )
              }
              className={`font-mono text-sm px-3.5 py-2 rounded-lg border-2 transition-all ${selectedTimes.includes(t) ? "border-primary bg-primary text-black font-bold" : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-primary/5"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          4. Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Prix (Ar)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={
                selectedRoute
                  ? `${selectedRoute.price?.toLocaleString()} (défaut)`
                  : ""
              }
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Véhicule
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              {VEHICLES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {loadingVehicleTemplate && (
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <Loader size={10} className="animate-spin" /> Chargement du plan véhicule...
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Template sièges
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const tpl = templates.find((t) => t.id === e.target.value);
                setSeatConfig(tpl?.seatConfig ?? null);
                setSelectedTemplateId(e.target.value);
              }}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">— Par défaut (véhicule) —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.seatConfig.totalSeats}p)
                </option>
              ))}
            </select>
            {seatConfig && !selectedTemplateId && (
              <p className="text-xs text-blue-600 font-semibold mt-1">
                🚐 Plan du véhicule {vehicle} ({seatConfig.totalSeats} places)
              </p>
            )}
            {seatConfig && selectedTemplateId && (
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                ✓ {seatConfig.totalSeats} places configurées
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary + CTA */}
      {canSubmit && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">
              {selectedRoute?.departure?.name} → {selectedRoute?.destination?.name}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedTimes.length} départ{selectedTimes.length > 1 ? "s" : ""}
              /jour · {dayCount} jour{dayCount > 1 ? "s" : ""} · ~
              <strong>{selectedTimes.length * dayCount}</strong> horaires
            </p>
          </div>
          <button
            onClick={() =>
              onNext({
                routeId,
                startDate,
                endDate,
                times: selectedTimes,
                price:
                  price !== "" ? Number(price) : (selectedRoute?.price ?? 0),
                vehicle,
                seatConfig,
                seatTemplateId: selectedTemplateId || null,
              })
            }
            className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all whitespace-nowrap"
          >
            <Zap size={16} /> Prévisualiser <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Preview ──────────────────────────────────────────────────────────
function PreviewStep({
  items: initialItems,
  routeLabel,
  summary,
  onBack,
  onConfirm,
  isSubmitting,
}: {
  routeId: string;
  items: EditableItem[];
  routeLabel: string;
  summary: { total: number; new: number; exists: number; past: number };
  onBack: () => void;
  onConfirm: (items: EditableItem[]) => void;
  isSubmitting: boolean;
}) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState(""),
    [editPrice, setEditPrice] = useState(""),
    [editVehicle, setEditVehicle] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "new" | "exists" | "past"
  >("new");

  const toggleExclude = (id: string) =>
    setItems((p) =>
      p.map((item) =>
        item.id === id ? { ...item, excluded: !item.excluded } : item,
      ),
    );
  const excludeAll = (status: "exists" | "past") =>
    setItems((p) =>
      p.map((item) =>
        item.status === status ? { ...item, excluded: true } : item,
      ),
    );
  const saveEdit = (id: string) => {
    setItems((p) =>
      p.map((item) =>
        item.id === id
          ? {
              ...item,
              price: Number(editPrice) || item.price,
              time: editTime || item.time,
              vehicle: editVehicle || item.vehicle,
              edited: true,
            }
          : item,
      ),
    );
    setEditingId(null);
  };

  const toCreate = items.filter((i) => !i.excluded && i.status === "new");
  const filtered =
    filterStatus === "all"
      ? items
      : items.filter((i) => i.status === filterStatus);

  const grouped = filtered.reduce<Record<string, EditableItem[]>>(
    (acc, item) => {
      const key = `${item.dayOfWeek} ${item.dateFormatted}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  const statusPill = (status: EditableItem["status"], excluded: boolean) => {
    if (excluded)
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
          Ignoré
        </span>
      );
    if (status === "new")
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          À créer
        </span>
      );
    if (status === "exists")
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          Existant
        </span>
      );
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
        Passé
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: summary.total, color: "text-gray-900" },
          { label: "À créer", value: summary.new, color: "text-emerald-600" },
          {
            label: "Existants",
            value: summary.exists,
            color: "text-amber-600",
          },
          { label: "Passés", value: summary.past, color: "text-gray-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-4 border border-gray-100"
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {(["all", "new", "exists", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filterStatus === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {f === "all"
                ? "Tous"
                : f === "new"
                  ? "À créer"
                  : f === "exists"
                    ? "Existants"
                    : "Passés"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {summary.exists > 0 && (
            <button
              onClick={() => excludeAll("exists")}
              className="text-xs font-semibold text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:border-amber-300"
            >
              Ignorer existants
            </button>
          )}
          {summary.past > 0 && (
            <button
              onClick={() => excludeAll("past")}
              className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300"
            >
              Ignorer passés
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            {routeLabel}
          </span>
          <span className="text-xs text-gray-400">
            {filtered.length} ligne{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {Object.entries(grouped).map(([dayLabel, dayItems]) => (
            <div key={dayLabel}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${DAY_COLORS[dayItems[0]!.dayOfWeek] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {dayLabel}
                </span>
              </div>
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 py-2.5 px-4 border-b border-gray-50 last:border-0 transition-all ${item.excluded ? "opacity-40" : ""} ${item.edited ? "bg-blue-50/50" : ""}`}
                >
                  <button
                    onClick={() =>
                      item.status === "new" && toggleExclude(item.id)
                    }
                    disabled={item.status !== "new"}
                    className={`size-5 rounded border-2 flex items-center justify-center shrink-0 ${item.status !== "new" ? "border-gray-200 bg-gray-100 cursor-not-allowed" : item.excluded ? "border-gray-300 bg-white" : "border-primary bg-primary"}`}
                  >
                    {!item.excluded && item.status === "new" && (
                      <Check size={11} className="text-black" />
                    )}
                  </button>
                  {editingId === item.id ? (
                    <>
                      <select
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="font-mono text-sm border border-primary/30 rounded-lg px-2 py-1 bg-white w-24 focus:outline-none"
                      >
                        {[...TIMES_HOURLY, ...TIMES_HALF]
                          .sort()
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                      </select>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="text-sm border border-primary/30 rounded-lg px-2 py-1 w-28 bg-white focus:outline-none"
                      />
                      <select
                        value={editVehicle}
                        onChange={(e) => setEditVehicle(e.target.value)}
                        className="text-sm border border-primary/30 rounded-lg px-2 py-1 bg-white focus:outline-none"
                      >
                        {VEHICLES.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="size-7 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                      >
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-mono font-bold text-gray-900 text-sm w-14 shrink-0">
                        {item.time}
                      </span>
                      <span className="text-sm text-gray-600 flex-1">
                        {item.price.toLocaleString()} Ar
                        {item.edited && (
                          <span className="ml-1 text-xs text-blue-500 font-semibold">
                            modifié
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 hidden sm:block w-20 shrink-0">
                        {item.vehicle}
                      </span>
                      {statusPill(item.status, item.excluded)}
                      {item.status === "new" && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditTime(item.time);
                              setEditPrice(String(item.price));
                              setEditVehicle(item.vehicle);
                            }}
                            className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => toggleExclude(item.id)}
                            className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm gap-4">
        <div>
          <p className="font-bold text-gray-900">
            {toCreate.length} horaire{toCreate.length > 1 ? "s" : ""} seront
            créés
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.filter((i) => i.excluded && i.status === "new").length} exclu
            {items.filter((i) => i.excluded && i.status === "new").length > 1
              ? "s"
              : ""}{" "}
            manuellement
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            <ChevronLeft size={16} /> Modifier
          </button>
          <button
            onClick={() => onConfirm(items)}
            disabled={toCreate.length === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex-1 sm:flex-auto justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Créer {toCreate.length}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────
function SuccessStep({
  created,
  skipped,
  onReset,
}: {
  created: number;
  skipped: number;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="size-24 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} className="text-emerald-600" />
        </div>
        <div className="absolute -top-1 -right-1 size-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs font-black text-black">{created}</span>
        </div>
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">
        Génération terminée !
      </h2>
      <p className="text-gray-500 mb-1">
        <strong className="text-emerald-600">{created}</strong> horaire
        {created > 1 ? "s" : ""} créé{created > 1 ? "s" : ""}
      </p>
      {skipped > 0 && (
        <p className="text-gray-400 text-sm mb-8">
          {skipped} ignoré{skipped > 1 ? "s" : ""} (existants ou passés)
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90"
        >
          <Plus size={16} /> Nouvelle génération
        </button>
        <a
          href="/admin/schedules"
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 justify-center"
        >
          <Calendar size={16} /> Voir les horaires
        </a>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GenerateSchedules() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"config" | "preview" | "success">("config");
  const [config, setConfig] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{
    items: EditableItem[];
    routeLabel: string;
    summary: any;
  } | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  const previewMutation = useMutation({
    mutationFn: async (cfg: any) => {
      const { data } = await api.post("/admin/schedules/preview", cfg);
      return data;
    },
    onSuccess: (data, cfg) => {
      const items: EditableItem[] = data.preview.map((p: any) => ({
        ...p,
        routeId: cfg.routeId,
        excluded: p.status !== "new",
        edited: false,
      }));
      setPreviewData({
        items,
        routeLabel: `${data.route.departure?.name} → ${data.route.destination?.name}`,
        summary: data.summary,
      });
      setStep("preview");
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (items: EditableItem[]) => {
      const toCreate = items
        .filter((i) => !i.excluded && i.status === "new")
        .map((i) => ({
          routeId: i.routeId,
          date: i.date,
          time: i.time,
          price: i.price,
          vehicle: i.vehicle,
          seatConfig: config?.seatConfig ?? null,
          seatTemplateId: config?.seatTemplateId ?? null,
        }));
      const { data } = await api.post("/admin/schedules/generate", {
        items: toCreate,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setResult({ created: data.created, skipped: data.skipped });
      setStep("success");
    },
  });

  const reset = () => {
    setStep("config");
    setConfig(null);
    setPreviewData(null);
    setResult(null);
  };

  const STEP_LABELS = ["Configuration", "Prévisualisation", "Terminé"];
  const STEP_IDX = { config: 0, preview: 1, success: 2 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Zap size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Génération automatique d'horaires
              </h1>
              <p className="text-gray-400 text-sm">
                Créez rapidement des voyages sur une période donnée
              </p>
            </div>
          </div>

          {step !== "success" && (
            <div className="flex items-center gap-0 mt-6 max-w-sm">
              {STEP_LABELS.slice(0, 2).map((label, i) => {
                const done = i < STEP_IDX[step];
                const active = i === STEP_IDX[step];
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`size-7 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all ${done ? "bg-primary border-primary text-black" : active ? "border-primary text-primary bg-white" : "border-gray-200 text-gray-400 bg-white"}`}
                    >
                      {done ? <Check size={12} /> : i + 1}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}
                    >
                      {label}
                    </span>
                    {i < 1 && (
                      <div
                        className={`flex-1 h-px mx-2 ${done ? "bg-primary" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {(previewMutation.isError || generateMutation.isError) && (
          <div className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              {(previewMutation.error as any)?.response?.data?.message ||
                (generateMutation.error as any)?.response?.data?.message ||
                "Une erreur est survenue"}
            </p>
          </div>
        )}

        {/* Loading */}
        {previewMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <RefreshCw
                size={20}
                className="absolute inset-0 m-auto text-primary"
              />
            </div>
            <p className="text-gray-500 mt-4 font-medium">
              Analyse des horaires en cours…
            </p>
          </div>
        )}

        {/* Steps */}
        {!previewMutation.isPending && (
          <>
            {step === "config" && (
              <ConfigStep
                onNext={(cfg) => {
                  setConfig(cfg);
                  previewMutation.mutate(cfg);
                }}
              />
            )}
            {step === "preview" && previewData && (
              <PreviewStep
                routeId={config!.routeId}
                items={previewData.items}
                routeLabel={previewData.routeLabel}
                summary={previewData.summary}
                onBack={() => setStep("config")}
                onConfirm={(items) => generateMutation.mutate(items)}
                isSubmitting={generateMutation.isPending}
              />
            )}
            {step === "success" && result && (
              <SuccessStep
                created={result.created}
                skipped={result.skipped}
                onReset={reset}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
