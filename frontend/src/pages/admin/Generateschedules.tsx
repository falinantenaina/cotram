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

// ─── Available times ──────────────────────────────────────────────────────────
const TIMES_HOURLY = Array.from({ length: 15 }, (_, i) => {
  const h = i + 5;
  return `${String(h).padStart(2, "0")}:00`;
}); // 05:00 – 19:00

const TIMES_HALF_HOURLY = Array.from({ length: 30 }, (_, i) => {
  const totalMinutes = (i + 10) * 30; // start at 05:00
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}).filter((t) => {
  const h = parseInt(t.split(":")[0]!);
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

// ─── Quick range presets ──────────────────────────────────────────────────────
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
  if (preset === "next-month") {
    const end = new Date(today);
    end.setMonth(today.getMonth() + 1);
    return { start: fmt(today), end: fmt(end) };
  }
  return { start: fmt(today), end: fmt(today) };
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

  useEffect(() => {
    seatTemplateApi.getAll().then(setTemplates);
  }, []);

  const applyTemplate = (id: string) => {
    const tpl = templates.find((t) => t._id === id);
    if (tpl) {
      setSeatConfig(tpl.seatConfig);
      setSelectedTemplateId(id);
    } else {
      setSeatConfig(null);
      setSelectedTemplateId("");
    }
  };

  const { data: routesData } = useQuery({
    queryKey: ["routes-gen"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes as {
        _id: string;
        departure: string;
        destination: string;
        price: number;
      }[];
    },
  });

  const selectedRoute = routesData?.find((r) => r._id === routeId);
  const times = timeMode === "hourly" ? TIMES_HOURLY : TIMES_HALF_HOURLY;

  const toggleTime = (t: string) =>
    setSelectedTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort(),
    );

  const applyPreset = (preset: string) => {
    const { start, end } = getPresetRange(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const selectAllTimes = () => setSelectedTimes([...times]);
  const clearTimes = () => setSelectedTimes([]);

  const canSubmit =
    routeId &&
    startDate &&
    endDate &&
    selectedTimes.length > 0 &&
    startDate <= endDate;

  const effectivePrice =
    price !== "" ? Number(price) : (selectedRoute?.price ?? 0);

  return (
    <div className="space-y-8">
      {/* Route selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          1. Trajet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routesData?.map((route) => (
            <button
              key={route._id}
              onClick={() => {
                setRouteId(route._id);
                if (price === "") setPrice(route.price);
              }}
              className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                routeId === route._id
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
              }`}
            >
              <div>
                <p className="font-bold text-gray-900">
                  {route.departure}
                  <ArrowRight
                    size={14}
                    className="inline mx-1.5 text-gray-400"
                  />
                  {route.destination}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {route.price.toLocaleString()} Ar / siège
                </p>
              </div>
              {routeId === route._id && (
                <div className="size-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <Check size={12} className="text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          2. Période
        </h3>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Cette semaine", key: "this-week" },
            { label: "Semaine prochaine", key: "next-week" },
            { label: "2 semaines", key: "next-2-weeks" },
            { label: "1 mois", key: "next-month" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
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
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {startDate && endDate && startDate <= endDate && (
          <p className="text-xs text-gray-400 mt-2">
            {Math.round(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1}{" "}
            jour(s) sélectionné(s)
          </p>
        )}
      </div>

      {/* Times */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            3. Heures de départ
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setTimeMode("hourly");
                  setSelectedTimes([]);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  timeMode === "hourly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Toutes les heures
              </button>
              <button
                onClick={() => {
                  setTimeMode("half");
                  setSelectedTimes([]);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                  timeMode === "half"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Toutes les 30 min
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={selectAllTimes}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tout sélectionner
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={clearTimes}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            Tout effacer
          </button>
          {selectedTimes.length > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">
                {selectedTimes.length} heure(s) sélectionnée(s)
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => toggleTime(t)}
              className={`font-mono text-sm px-3.5 py-2 rounded-lg border-2 transition-all ${
                selectedTimes.includes(t)
                  ? "border-primary bg-primary text-black font-bold shadow-sm shadow-primary/20"
                  : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          4. Options
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Prix par siège (Ar)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={
                selectedRoute
                  ? `${selectedRoute.price.toLocaleString()} (défaut)`
                  : "Prix par défaut du trajet"
              }
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Véhicule
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              // useEffect se charge de charger le template
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
            >
              {VEHICLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Template de sièges
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
            >
              <option value="">
                — Aucun template (16 places par défaut) —
              </option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.seatConfig.totalSeats} places)
                </option>
              ))}
            </select>
            {seatConfig && (
              <p className="text-xs text-emerald-600 font-semibold mt-1.5">
                ✓ {seatConfig.totalSeats} places · {seatConfig.rows?.length}{" "}
                rangées
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary + CTA */}
      {canSubmit && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">
              {selectedRoute?.departure} → {selectedRoute?.destination}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedTimes.length} départ(s)/jour ·{" "}
              {Math.round(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ) + 1}{" "}
              jour(s) ·{" "}
              <strong>
                ~
                {selectedTimes.length *
                  (Math.round(
                    (new Date(endDate).getTime() -
                      new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ) +
                    1)}{" "}
                horaires
              </strong>
            </p>
          </div>
          <button
            onClick={() =>
              onNext({
                routeId,
                startDate,
                endDate,
                times: selectedTimes,
                price: effectivePrice,
                vehicle,
                seatConfig,
              })
            }
            className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            <Zap size={16} />
            Prévisualiser
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Preview & Edit ───────────────────────────────────────────────────
function PreviewStep({
  routeId,
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
  const [editPrice, setEditPrice] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "new" | "exists" | "past"
  >("new");
  const [groupByDay, setGroupByDay] = useState(true);

  const toggleExclude = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, excluded: !item.excluded } : item,
      ),
    );

  const excludeAll = (status: "exists" | "past") =>
    setItems((prev) =>
      prev.map((item) =>
        item.status === status ? { ...item, excluded: true } : item,
      ),
    );

  const startEdit = (item: EditableItem) => {
    setEditingId(item.id);
    setEditPrice(String(item.price));
    setEditTime(item.time);
    setEditVehicle(item.vehicle);
  };

  const saveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
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

  // Group by date
  const grouped = groupByDay
    ? filtered.reduce<Record<string, EditableItem[]>>((acc, item) => {
        const key = `${item.dayOfWeek} ${item.dateFormatted}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {})
    : null;

  const statusPill = (status: EditableItem["status"], excluded: boolean) => {
    if (excluded)
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 line-through">
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
          Déjà existant
        </span>
      );
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
        Passé
      </span>
    );
  };

  const renderRow = (item: EditableItem) => (
    <div
      key={item.id}
      className={`flex items-center gap-3 py-3 px-4 border-b border-gray-50 last:border-0 transition-all ${
        item.excluded ? "opacity-40" : ""
      } ${item.edited ? "bg-blue-50/50" : ""}`}
    >
      {/* Toggle */}
      <button
        onClick={() => {
          if (item.status === "new") toggleExclude(item.id);
        }}
        disabled={item.status !== "new"}
        className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
          item.status !== "new"
            ? "border-gray-200 bg-gray-100 cursor-not-allowed"
            : item.excluded
              ? "border-gray-300 bg-white"
              : "border-primary bg-primary"
        }`}
      >
        {!item.excluded && item.status === "new" && (
          <Check size={11} className="text-black" />
        )}
      </button>

      {/* Day badge - only when not grouped */}
      {!groupByDay && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
            DAY_COLORS[item.dayOfWeek] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {item.dayOfWeek.slice(0, 3)}
        </span>
      )}

      {/* Date */}
      {!groupByDay && (
        <span className="text-sm text-gray-500 w-28 shrink-0 hidden sm:block">
          {item.dateFormatted}
        </span>
      )}

      {/* Time */}
      {editingId === item.id ? (
        <select
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          className="font-mono text-sm border border-primary/30 rounded-lg px-2 py-1 bg-white focus:outline-none w-24"
        >
          {TIMES_HOURLY.concat(TIMES_HALF_HOURLY)
            .sort()
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
      ) : (
        <span className="font-mono font-bold text-gray-900 text-sm w-14 shrink-0">
          {item.time}
        </span>
      )}

      {/* Price */}
      {editingId === item.id ? (
        <input
          type="number"
          value={editPrice}
          onChange={(e) => setEditPrice(e.target.value)}
          className="text-sm border border-primary/30 rounded-lg px-2 py-1 w-28 bg-white focus:outline-none"
        />
      ) : (
        <span className="text-sm text-gray-600 flex-1">
          {item.price.toLocaleString()} Ar
          {item.edited && (
            <span className="ml-1 text-xs text-blue-500 font-semibold">
              modifié
            </span>
          )}
        </span>
      )}

      {/* Vehicle */}
      {editingId === item.id ? (
        <select
          value={editVehicle}
          onChange={(e) => setEditVehicle(e.target.value)}
          className="text-sm border border-primary/30 rounded-lg px-2 py-1 bg-white focus:outline-none"
        >
          {VEHICLES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-gray-400 hidden sm:block w-20 shrink-0">
          {item.vehicle}
        </span>
      )}

      {/* Status */}
      <div className="shrink-0">{statusPill(item.status, item.excluded)}</div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editingId === item.id ? (
          <>
            <button
              onClick={() => saveEdit(item.id)}
              className="size-7 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="size-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          item.status === "new" && (
            <>
              <button
                onClick={() => startEdit(item)}
                className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => toggleExclude(item.id)}
                className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total généré",
            value: summary.total,
            color: "text-gray-900",
          },
          {
            label: "À créer",
            value: summary.new,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Déjà existants",
            value: summary.exists,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Passés (ignorés)",
            value: summary.past,
            color: "text-gray-400",
            bg: "bg-gray-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 ${s.bg ?? "bg-gray-50"} border border-gray-100`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {(["all", "new", "exists", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
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

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setGroupByDay(!groupByDay)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-all"
          >
            {groupByDay ? "Vue liste" : "Vue par jour"}
          </button>
          {summary.exists > 0 && (
            <button
              onClick={() => excludeAll("exists")}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-all"
            >
              Ignorer les existants
            </button>
          )}
          {summary.past > 0 && (
            <button
              onClick={() => excludeAll("past")}
              className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-all"
            >
              Ignorer les passés
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
            {filtered.length} ligne(s) affichée(s)
          </span>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {groupByDay && grouped ? (
            Object.entries(grouped).map(([dayLabel, dayItems]) => (
              <div key={dayLabel}>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      DAY_COLORS[dayItems[0]!.dayOfWeek] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {dayLabel}
                  </span>
                </div>
                {dayItems.map(renderRow)}
              </div>
            ))
          ) : (
            <div>{filtered.map(renderRow)}</div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div>
          <p className="font-bold text-gray-900">
            {toCreate.length} horaire(s) seront créés
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.filter((i) => i.excluded && i.status === "new").length}{" "}
            exclu(s) manuellement
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
            Modifier
          </button>
          <button
            onClick={() => onConfirm(items)}
            disabled={toCreate.length === 0 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Créer {toCreate.length} horaire(s)
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
        <strong className="text-emerald-600">{created}</strong> horaire(s)
        créé(s) avec succès
      </p>
      {skipped > 0 && (
        <p className="text-gray-400 text-sm mb-8">
          {skipped} ignoré(s) (existants ou passés)
        </p>
      )}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          <Plus size={16} />
          Nouvelle génération
        </button>
        <a
          href="/admin/schedules"
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Calendar size={16} />
          Voir les horaires
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateSchedules() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"config" | "preview" | "success">("config");
  const [config, setConfig] = useState<{
    routeId: string;
    startDate: string;
    endDate: string;
    times: string[];
    price: number;
    vehicle: string;
    seatConfig: SeatConfig | null;
  } | null>(null);
  const [previewData, setPreviewData] = useState<{
    items: EditableItem[];
    routeLabel: string;
    summary: { total: number; new: number; exists: number; past: number };
  } | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (cfg: typeof config) => {
      const { data } = await api.post("/admin/schedules/preview", cfg);
      return data;
    },
    onSuccess: (data, cfg) => {
      const items: EditableItem[] = data.preview.map((p: any) => ({
        ...p,
        routeId: cfg!.routeId,
        excluded: p.status !== "new", // auto-exclude non-new
        edited: false,
      }));
      setPreviewData({
        items,
        routeLabel: `${data.route.departure} → ${data.route.destination}`,
        summary: data.summary,
      });
      setStep("preview");
    },
  });

  // Generate mutation
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

  const handleConfig = (cfg: NonNullable<typeof config>) => {
    setConfig(cfg);
    previewMutation.mutate(cfg);
  };

  const reset = () => {
    setStep("config");
    setConfig(null);
    setPreviewData(null);
    setResult(null);
  };

  const stepLabels = ["Configuration", "Prévisualisation", "Terminé"];
  const stepIndex = { config: 0, preview: 1, success: 2 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Génération automatique d'horaires
              </h1>
              <p className="text-gray-400 text-sm">
                Créez rapidement des voyages sur une période donnée
              </p>
            </div>
          </div>

          {/* Step indicator */}
          {step !== "success" && (
            <div className="flex items-center gap-0 mt-6 max-w-sm">
              {stepLabels.slice(0, 2).map((label, i) => {
                const done = i < stepIndex[step];
                const active = i === stepIndex[step];
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`size-7 rounded-full text-xs font-bold flex items-center justify-center border-2 transition-all ${
                        done
                          ? "bg-primary border-primary text-black"
                          : active
                            ? "border-primary text-primary bg-white"
                            : "border-gray-200 text-gray-400 bg-white"
                      }`}
                    >
                      {done ? <Check size={12} /> : i + 1}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:block ${
                        active ? "text-gray-900" : "text-gray-400"
                      }`}
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

        {/* Error banner */}
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

        {/* Loading overlay for preview */}
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
              Analyse des horaires en cours...
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Vérification des doublons et des conflits
            </p>
          </div>
        )}

        {/* Steps */}
        {!previewMutation.isPending && (
          <>
            {step === "config" && <ConfigStep onNext={handleConfig} />}

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
