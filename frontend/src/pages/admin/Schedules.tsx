import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Filter,
  Hash,
  History,
  Layers,
  Loader,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { vehicleTemplateApi } from "../../api/vehicleTemplateApi";
import { SeatLayoutEditor } from "../../components/admin/SeatLayoutEditor";
import { buildFallbackConfig, type SeatConfig } from "../../config/seatLayouts";
import api from "../../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
}

interface Schedule {
  _id: string;
  route: {
    _id: string;
    departure: string;
    destination: string;
    duration: string;
    price: number;
  };
  driver?: Driver | string | null;
  vehicleNumber?: string | null;
  date: string;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number[];
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  seatConfig?: SeatConfig | null;
}

interface Route {
  _id: string;
  departure: string;
  destination: string;
  price: number;
  duration: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  scheduled: {
    label: "Planifié",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  in_progress: {
    label: "En cours",
    dot: "bg-blue-400 animate-pulse",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Terminé",
    dot: "bg-gray-300",
    badge: "bg-gray-50 text-gray-500 border-gray-200",
  },
  cancelled: {
    label: "Annulé",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

const DRIVER_STATUS = {
  available: { label: "Disponible", dot: "bg-emerald-400" },
  on_trip: { label: "En voyage", dot: "bg-blue-400 animate-pulse" },
  off_duty: { label: "Hors service", dot: "bg-amber-400" },
  suspended: { label: "Suspendu", dot: "bg-red-400" },
};

const VEHICLES = ["Crafter", "Sprinter", "Transit"];

const ROUTE_COLORS = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-rose-500 to-red-500",
  "from-cyan-500 to-blue-500",
];

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
];

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashColor(arr: string[], id: string) {
  if (!id || !arr.length) return arr[0] ?? "";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return arr[Math.abs(h) % arr.length]!;
}

function occupancyBarColor(pct: number) {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-400";
  if (pct >= 40) return "bg-emerald-400";
  return "bg-gray-300";
}

function driverInitials(d: Driver) {
  return `${d.firstName[0] ?? ""}${d.lastName[0] ?? ""}`.toUpperCase();
}

function getDriverObj(
  driver: Driver | string | null | undefined,
): Driver | null {
  if (!driver || typeof driver === "string") return null;
  return driver;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Passenger Modal ──────────────────────────────────────────────────────────
function PassengerModal({
  schedule,
  onClose,
}: {
  schedule: Schedule;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
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
  const allPassengers: Passenger[] = data?.passengers ?? [];
  const passengers = search.trim()
    ? allPassengers.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.user.name.toLowerCase().includes(q) ||
          p.user.email.toLowerCase().includes(q) ||
          (p.user.phone && p.user.phone.includes(q)) ||
          p.bookingReference.toLowerCase().includes(q) ||
          p.seats.some((s) => String(s).includes(q))
        );
      })
    : allPassengers;

  const occupiedCount = schedule.totalSeats - schedule.availableSeats;
  const occupancyPct =
    schedule.totalSeats > 0
      ? Math.round((occupiedCount / schedule.totalSeats) * 100)
      : 0;

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
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="bg-gray-900 text-white p-4 sm:p-6 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">
                <Users size={12} />
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
              className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 ml-2"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{occupiedCount} passagers</span>
              <span>
                {schedule.availableSeats} libres · {occupancyPct}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        </div>
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
        {allPassengers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, siège, référence…"
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}
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
                      <span className="truncate max-w-[160px]">
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
          {!isLoading && (
            <p className="text-xs text-gray-400">
              {search
                ? `${passengers.length} résultat${passengers.length > 1 ? "s" : ""}`
                : `${allPassengers.length} passager${allPassengers.length > 1 ? "s" : ""}`}
            </p>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────
function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="size-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Assign Driver Modal ──────────────────────────────────────────────────────
function AssignDriverModal({
  scheduleId,
  currentDriver,
  onClose,
  onSuccess,
}: {
  scheduleId: string;
  currentDriver?: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    currentDriver?._id ?? "",
  );
  const [vehicleNumber, setVehicleNumber] = useState(
    currentDriver?.vehicleNumber ?? "",
  );
  const [error, setError] = useState("");

  const { data } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/schedules/${scheduleId}/assign-driver`, {
        driverId: selectedId || null,
        vehicleNumber: vehicleNumber || undefined,
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const drivers = (data?.drivers ?? []).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.vehicleNumber.toLowerCase().includes(q)
    );
  });
  const selectedDriver = (data?.drivers ?? []).find(
    (d) => d._id === selectedId,
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                Assignation
              </p>
              <h2 className="text-lg font-black">Choisir un chauffeur</h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <button
              onClick={() => {
                setSelectedId("");
                setVehicleNumber("");
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${!selectedId ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}
            >
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500">Non assigné</p>
                <p className="text-xs text-gray-400">Retirer le chauffeur</p>
              </div>
              {!selectedId && <Check size={14} className="text-primary" />}
            </button>
            {drivers.map((d) => {
              const isSelected = d._id === selectedId;
              const unavailable =
                (d.status === "on_trip" || d.status === "suspended") &&
                d._id !== currentDriver?._id;
              return (
                <button
                  key={d._id}
                  onClick={() => {
                    if (unavailable) return;
                    setSelectedId(d._id);
                    setVehicleNumber(d.vehicleNumber);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-primary/5" : unavailable ? "border-gray-100 opacity-40 cursor-not-allowed" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"}`}
                >
                  <div
                    className={`size-9 rounded-xl bg-gradient-to-br ${hashColor(AVATAR_COLORS, d._id)} flex items-center justify-center text-white font-black text-sm shrink-0`}
                  >
                    {driverInitials(d)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {d.firstName} {d.lastName}
                      </p>
                      <span
                        className={`size-1.5 rounded-full shrink-0 ${DRIVER_STATUS[d.status].dot}`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      {d.vehicleNumber} · {d.vehicleType}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedId && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Immatriculation pour ce voyage
              </label>
              <div className="relative">
                <Hash
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(e.target.value.toUpperCase())
                  }
                  placeholder={selectedDriver?.vehicleNumber ?? "1234 TA"}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}{" "}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Card ─────────────────────────────────────────────────────────────
function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignDriver,
  onViewPassengers,
  selected,
  onSelect,
}: {
  schedule: Schedule;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAssignDriver: (s: Schedule) => void;
  onViewPassengers: (s: Schedule) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[schedule.status] ?? STATUS_CONFIG.scheduled;
  const occupiedCount = schedule.totalSeats - schedule.availableSeats;
  const pct = Math.round((occupiedCount / schedule.totalSeats) * 100);
  const routeColor = hashColor(
    ROUTE_COLORS,
    schedule.route?._id ?? schedule._id,
  );
  const depDate = new Date(schedule.date);
  const isToday = depDate.toDateString() === new Date().toDateString();
  const isPast = depDate < new Date() && !isToday;
  const vehicleDisplay = schedule.vehicleNumber || schedule.vehicle;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${selected ? "border-primary shadow-sm shadow-primary/10" : schedule.status === "in_progress" ? "border-blue-200 shadow-sm shadow-blue-500/10" : "border-gray-100 hover:border-gray-200"} ${isPast && schedule.status === "completed" ? "opacity-60" : ""}`}
    >
      <div
        className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${schedule.status === "in_progress" ? "from-blue-400 to-blue-600 animate-pulse" : `${routeColor} opacity-70`}`}
      />
      {schedule.status === "in_progress" && (
        <div className="absolute top-2 right-12 flex items-center gap-1.5 bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-10 pointer-events-none">
          <span className="relative flex size-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full size-1.5 bg-white" />
          </span>
          EN COURS
        </div>
      )}
      <div className="flex items-center gap-3 px-5 py-3.5 pl-6">
        <button
          onClick={() => onSelect(schedule._id)}
          className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-primary bg-primary" : "border-gray-300 hover:border-primary/50"}`}
        >
          {selected && <Check size={11} className="text-black" />}
        </button>
        <div className="w-20 shrink-0">
          <span className="text-xl font-black text-gray-900 font-mono leading-none">
            {schedule.time}
          </span>
          <p
            className={`text-xs font-semibold mt-0.5 ${isToday ? "text-primary" : "text-gray-400"}`}
          >
            {isToday
              ? "Aujourd'hui"
              : depDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 text-sm truncate">
              {schedule.route.departure}
            </span>
            <ArrowRight size={11} className="text-gray-400 shrink-0" />
            <span className="font-bold text-gray-900 text-sm truncate">
              {schedule.route.destination}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Bus size={10} /> {vehicleDisplay}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {schedule.route.duration}
            </span>
            {schedule.seatConfig && (
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                <Layers size={9} /> {schedule.seatConfig.totalSeats}p
              </span>
            )}
          </div>
        </div>
        <div className="w-36 shrink-0 hidden xl:block">
          {(() => {
            const d = getDriverObj(schedule.driver);
            return d ? (
              <button
                onClick={() => onAssignDriver(schedule)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full"
              >
                <div
                  className={`size-7 rounded-lg bg-gradient-to-br ${hashColor(AVATAR_COLORS, d._id)} flex items-center justify-center text-white text-[10px] font-black shrink-0`}
                >
                  {driverInitials(d)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {d.firstName} {d.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {schedule.vehicleNumber ?? d.vehicleNumber}
                  </p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => onAssignDriver(schedule)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary border border-dashed border-gray-200 hover:border-primary/40 hover:bg-primary/5 rounded-xl px-2.5 py-1.5 transition-all w-full justify-center"
              >
                <User size={11} /> Assigner
              </button>
            );
          })()}
        </div>
        <div className="w-32 shrink-0 hidden lg:block">
          <button
            onClick={() => onViewPassengers(schedule)}
            className="w-full text-left hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users size={10} /> {occupiedCount}/{schedule.totalSeats}
              </span>
              <span
                className={`text-xs font-bold ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-gray-500"}`}
              >
                {pct}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${occupancyBarColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        </div>
        <div className="w-24 text-right shrink-0 hidden md:block">
          <p className="font-black text-gray-900 text-sm">
            {schedule.price.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal ml-0.5">Ar</span>
          </p>
          <p className="text-[10px] text-gray-400">par siège</p>
        </div>
        <div className="shrink-0 hidden sm:block">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${cfg.badge}`}
          >
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
              <div className="p-1">
                <button
                  onClick={() => {
                    onEdit(schedule);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  onClick={() => {
                    onAssignDriver(schedule);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <User size={14} />{" "}
                  {schedule.driver ? "Changer chauffeur" : "Assigner chauffeur"}
                </button>
                <button
                  onClick={() => {
                    onViewPassengers(schedule);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Users size={14} /> Voir les passagers
                </button>
                {schedule.status === "scheduled" && (
                  <>
                    <button
                      onClick={() => {
                        onStatusChange(schedule._id, "in_progress");
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Zap size={14} /> Démarrer
                    </button>
                    <button
                      onClick={() => {
                        onStatusChange(schedule._id, "cancelled");
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X size={14} /> Annuler
                    </button>
                  </>
                )}
                {schedule.status === "in_progress" && (
                  <button
                    onClick={() => {
                      onStatusChange(schedule._id, "completed");
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <Check size={14} /> Marquer terminé
                  </button>
                )}
                {schedule.status === "cancelled" && (
                  <button
                    onClick={() => {
                      onStatusChange(schedule._id, "scheduled");
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <Check size={14} /> Réactiver
                  </button>
                )}
              </div>
              <div className="border-t border-gray-100 p-1">
                <button
                  onClick={() => {
                    onDelete(schedule._id);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({
  schedules,
  onEdit,
}: {
  schedules: Schedule[];
  onEdit: (s: Schedule) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const byDate = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const k = toLocalDateKey(new Date(s.date));
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-gray-900 text-lg">
            {MONTHS_FR[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg"
          >
            Aujourd'hui
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-50">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const cellDate = isValid ? new Date(year, month, dayNum) : null;
          const dateKey = cellDate ? toLocalDateKey(cellDate) : "";
          const daySchedules = byDate[dateKey] ?? [];
          const isToday =
            cellDate?.toDateString() === new Date().toDateString();
          const isPast = cellDate ? cellDate < todayMid : false;
          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 border-b border-r border-gray-50 ${!isValid ? "bg-gray-50/50" : isPast ? "bg-gray-50/30" : ""}`}
            >
              {isValid && (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-black" : isPast ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {dayNum}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((s) => {
                      const sCfg =
                        STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
                      return (
                        <button
                          key={s._id}
                          onClick={() => onEdit(s)}
                          className={`w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border hover:scale-[1.02] transition-all ${sCfg.badge}`}
                        >
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${sCfg.dot}`}
                          />
                          <span className="font-mono">{s.time}</span>
                          <span className="truncate opacity-70">
                            {s.route.destination}
                          </span>
                        </button>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1 font-semibold">
                        +{daySchedules.length - 3} autres
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({
  schedule,
  routes,
  drivers,
  onClose,
  onSuccess,
}: {
  schedule: Schedule | null;
  routes: Route[];
  drivers: Driver[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"infos" | "seats">("infos");
  const [form, setForm] = useState({
    route: schedule?.route._id ?? "",
    date: schedule ? schedule.date.split("T")[0]! : "",
    time: schedule?.time ?? "",
    price: schedule?.price ?? 0,
    vehicle: schedule?.vehicle ?? "Crafter",
    vehicleNumber: schedule?.vehicleNumber ?? "",
    driverId: getDriverObj(schedule?.driver)?._id ?? "",
    notes: schedule?.notes ?? "",
  });
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(
    schedule?.seatConfig ?? buildFallbackConfig(schedule?.totalSeats ?? 16),
  );
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [error, setError] = useState("");

  // Quand le véhicule change et qu'on n'a pas encore de seatConfig personnalisé
  // → charger le template du véhicule
  const handleVehicleChange = async (vehicle: string) => {
    setForm((f) => ({ ...f, vehicle }));
    // Ne pas écraser un plan déjà configuré sur cet horaire
    if (schedule?.seatConfig) return;
    const template = await vehicleTemplateApi.getByType(vehicle);
    if (template) setSeatConfig(template.seatConfig);
  };

  // Au montage : si pas de seatConfig sur l'horaire → charger le template du véhicule
  useEffect(() => {
    if (schedule?.seatConfig) return; // déjà configuré, ne pas écraser
    vehicleTemplateApi.getByType(form.vehicle).then((template) => {
      if (template) setSeatConfig(template.seatConfig);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAsTemplate = async () => {
    if (!seatConfig) return;
    setSavingTemplate(true);
    try {
      await vehicleTemplateApi.save(form.vehicle, seatConfig);
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde du modèle");
    } finally {
      setSavingTemplate(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        route: form.route,
        date: form.date,
        time: form.time,
        price: form.price,
        vehicle: form.vehicle,
        vehicleNumber: form.vehicleNumber || null,
        driver: form.driverId || null,
        notes: form.notes || null,
        seatConfig: seatConfig ?? null,
        totalSeats: seatConfig?.totalSeats ?? 16,
      };
      if (!schedule) payload.availableSeats = seatConfig?.totalSeats ?? 16;
      if (schedule) return api.put(`/schedules/${schedule._id}`, payload);
      return api.post("/schedules", payload);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const selectedRoute = routes.find((r) => r._id === form.route);
  const selectedDriver = drivers.find((d) => d._id === form.driverId);
  const inp =
    "w-full border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                {schedule ? "Modifier l'horaire" : "Nouvel horaire"}
              </p>
              <h2 className="text-lg font-black">
                {schedule
                  ? `${schedule.route.departure} → ${schedule.route.destination}`
                  : "Créer un voyage"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl w-fit">
            {(["infos", "seats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? "bg-white text-gray-900" : "text-white/60 hover:text-white"}`}
              >
                {tab === "infos" ? (
                  "Informations"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} />
                    Plan des sièges
                    {seatConfig ? (
                      <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {seatConfig.totalSeats}
                      </span>
                    ) : (
                      <span className="bg-white/20 text-white/60 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        Non défini
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle
                size={15}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Tab Informations ── */}
          {activeTab === "infos" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trajet
                </label>
                <select
                  value={form.route}
                  onChange={(e) => {
                    const r = routes.find((x) => x._id === e.target.value);
                    setForm({
                      ...form,
                      route: e.target.value,
                      price: r?.price ?? form.price,
                    });
                  }}
                  className={inp}
                >
                  <option value="">Sélectionner un trajet</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.departure} → {r.destination}
                    </option>
                  ))}
                </select>
                {selectedRoute && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Clock size={10} /> {selectedRoute.duration} · Prix défaut :{" "}
                    {selectedRoute.price.toLocaleString()} Ar
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className={`${inp} font-mono`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Prix (Ar/siège)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Type véhicule
                  </label>
                  <select
                    value={form.vehicle}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className={inp}
                  >
                    {VEHICLES.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={11} /> Chauffeur & Véhicule
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Chauffeur (optionnel)
                  </label>
                  <select
                    value={form.driverId}
                    onChange={(e) => {
                      const d = drivers.find((x) => x._id === e.target.value);
                      setForm({
                        ...form,
                        driverId: e.target.value,
                        vehicleNumber: d?.vehicleNumber ?? form.vehicleNumber,
                      });
                    }}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">— Aucun chauffeur —</option>
                    {drivers.map((d) => (
                      <option
                        key={d._id}
                        value={d._id}
                        disabled={d.status === "suspended"}
                      >
                        {d.firstName} {d.lastName} ({d.vehicleType})
                        {d.status !== "available"
                          ? ` – ${DRIVER_STATUS[d.status].label}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {selectedDriver && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <Phone size={10} /> {selectedDriver.phone}
                      <span className="text-gray-300">·</span>
                      <Hash size={10} /> {selectedDriver.vehicleNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Immatriculation
                  </label>
                  <div className="relative">
                    <Hash
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={form.vehicleNumber}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          vehicleNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="ex: 1234 TA"
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-8 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              {/* CTA vers l'onglet sièges */}
              <button
                type="button"
                onClick={() => setActiveTab("seats")}
                className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-sm font-semibold text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Layers size={15} />
                {seatConfig
                  ? `Plan configuré — ${seatConfig.totalSeats} places · Modifier →`
                  : "Configurer le plan des sièges →"}
              </button>
            </div>
          )}

          {/* ── Tab Plan des sièges ── */}
          {activeTab === "seats" && (
            <div className="space-y-4">
              <SeatLayoutEditor value={seatConfig} onChange={setSeatConfig} />
              {seatConfig && (
                <button
                  type="button"
                  onClick={saveAsTemplate}
                  disabled={savingTemplate}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    templateSaved
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-dashed border-primary/40 text-primary/70 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {savingTemplate ? (
                    <Loader size={14} className="animate-spin" />
                  ) : templateSaved ? (
                    <>
                      <Check size={14} /> Modèle sauvegardé pour {form.vehicle}{" "}
                      !
                    </>
                  ) : (
                    <>
                      <Bus size={14} /> Sauvegarder comme modèle {form.vehicle}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-gray-50 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.route || !form.date || !form.time || mutation.isPending
            }
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {schedule ? "Sauvegarder" : "Créer le voyage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteModal({
  count,
  onConfirm,
  onClose,
  isLoading,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="size-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">
          Supprimer {count} horaire{count > 1 ? "s" : ""} ?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}{" "}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "past"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalSchedule, setModalSchedule] = useState<Schedule | null | "new">(
    null,
  );
  const [assignTarget, setAssignTarget] = useState<Schedule | null>(null);
  const [passengerTarget, setPassengerTarget] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | "bulk" | null>(
    null,
  );
  const [includeHistory, setIncludeHistory] = useState(false);

  const {
    data: schedulesRaw = [],
    isLoading,
    refetch,
  } = useQuery<Schedule[]>({
    queryKey: ["admin-schedules", includeHistory],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/schedules${includeHistory ? "?includeHistory=true" : ""}`,
      );
      return data.schedules;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const { data: routesData } = useQuery<{ routes: Route[] }>({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data;
    },
  });
  const { data: driversData } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const routes = routesData?.routes ?? [];
  const drivers = driversData?.drivers ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      Promise.all(ids.map((id) => api.delete(`/schedules/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setSelectedIds(new Set());
      setDeleteTarget(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/schedules/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const schedules = schedulesRaw.filter((s) => {
    const d = new Date(toLocalDateKey(new Date(s.date)).replace(/-/g, "/"));
    d.setHours(0, 0, 0, 0);
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (routeFilter !== "all" && s.route._id !== routeFilter) return false;
    if (dateFilter === "today" && d.toDateString() !== today.toDateString())
      return false;
    if (dateFilter === "week" && (d < today || d >= nextWeek)) return false;
    if (dateFilter === "past" && d >= today) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.route.departure.toLowerCase().includes(q) ||
        s.route.destination.toLowerCase().includes(q) ||
        s.time.includes(q) ||
        s.vehicle.toLowerCase().includes(q) ||
        (getDriverObj(s.driver)?.firstName.toLowerCase().includes(q) ??
          false) ||
        (getDriverObj(s.driver)?.lastName.toLowerCase().includes(q) ?? false) ||
        (s.vehicleNumber?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const todaySchedules = schedulesRaw.filter(
    (s) =>
      new Date(s.date + "T00:00:00").toDateString() ===
      new Date().toDateString(),
  );
  const totalSeatsToday = todaySchedules.reduce(
    (sum, s) => sum + s.totalSeats,
    0,
  );
  const occupiedToday = todaySchedules.reduce(
    (sum, s) => sum + (s.totalSeats - s.availableSeats),
    0,
  );
  const weekSchedules = schedulesRaw.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    return d >= today && d < nextWeek;
  }).length;
  const unassigned = schedulesRaw.filter(
    (s) =>
      !getDriverObj(s.driver) &&
      s.status === "scheduled" &&
      new Date(s.date + "T00:00:00") >= today,
  ).length;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === schedules.length
        ? new Set()
        : new Set(schedules.map((s) => s._id)),
    );
  const confirmDelete = () => {
    if (deleteTarget === "bulk") deleteMutation.mutate([...selectedIds]);
    else if (deleteTarget) deleteMutation.mutate([deleteTarget]);
  };

  const activeFiltersCount = [
    statusFilter !== "all",
    routeFilter !== "all",
    dateFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Horaires</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {schedulesRaw.length} voyage{schedulesRaw.length !== 1 ? "s" : ""}{" "}
              au total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/trips/history"
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-semibold px-3 py-2.5 rounded-xl text-sm transition-all"
            >
              <History size={15} /> Historique
            </Link>
            <Link
              to="/admin/schedules/generate"
              className="flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-bold px-3 py-2.5 rounded-xl text-sm transition-all"
            >
              <Zap size={15} /> Génération auto
            </Link>
            <button
              onClick={() => setModalSchedule("new")}
              className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <Plus size={15} /> Nouvel horaire
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat
            label="Voyages aujourd'hui"
            value={todaySchedules.length}
            icon={Calendar}
          />
          <MiniStat
            label="Taux remplissage (auj.)"
            value={
              totalSeatsToday
                ? `${Math.round((occupiedToday / totalSeatsToday) * 100)}%`
                : "—"
            }
            icon={TrendingUp}
          />
          <MiniStat
            label="Cette semaine"
            value={weekSchedules}
            icon={CalendarDays}
          />
          <MiniStat
            label="Sans chauffeur (à venir)"
            value={unassigned}
            icon={User}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Trajet, heure, chauffeur…"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters || activeFiltersCount > 0 ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            <Filter size={14} /> Filtres
            {activeFiltersCount > 0 && (
              <span className="size-5 bg-primary rounded-full text-black text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(["list", "calendar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {v === "list" ? "Liste" : "Calendrier"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIncludeHistory(!includeHistory)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${includeHistory ? "border-gray-800 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
          >
            <History size={14} />
            <span className="hidden sm:inline">
              {includeHistory ? "Avec historique" : "Sans historique"}
            </span>
          </button>
          <button
            onClick={() => refetch()}
            className="size-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "all",
                      "scheduled",
                      "in_progress",
                      "completed",
                      "cancelled",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${statusFilter === s ? "border-primary bg-primary text-black" : "border-gray-200 text-gray-600 hover:border-primary/40"}`}
                    >
                      {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trajet
                </label>
                <select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="all">Tous les trajets</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.departure} → {r.destination}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Période
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "all", label: "Tout" },
                      { key: "today", label: "Aujourd'hui" },
                      { key: "week", label: "Cette semaine" },
                      { key: "past", label: "Passés" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDateFilter(key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${dateFilter === key ? "border-primary bg-primary text-black" : "border-gray-200 text-gray-600 hover:border-primary/40"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setRouteFilter("all");
                  setDateFilter("all");
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl">
            <span className="text-sm font-semibold">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setDeleteTarget("bulk")}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold"
            >
              <Trash2 size={13} /> Supprimer
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="size-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="size-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Chargement des horaires…</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <CalendarDays size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Aucun horaire trouvé
            </h3>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">
              Commencez par créer un horaire ou utilisez la génération
              automatique
            </p>
            <div className="flex gap-3">
              <Link
                to="/admin/schedules/generate"
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Sparkles size={15} /> Génération auto
              </Link>
              <button
                onClick={() => setModalSchedule("new")}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                <Plus size={15} /> Créer manuellement
              </button>
            </div>
          </div>
        ) : view === "calendar" ? (
          <CalendarView
            schedules={schedules}
            onEdit={(s) => setModalSchedule(s)}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-5 py-2">
              <button
                onClick={toggleSelectAll}
                className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selectedIds.size === schedules.length && schedules.length > 0 ? "border-primary bg-primary" : "border-gray-300 hover:border-primary/50"}`}
              >
                {selectedIds.size === schedules.length &&
                  schedules.length > 0 && (
                    <Check size={11} className="text-black" />
                  )}
              </button>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {selectedIds.size > 0
                  ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}`
                  : `${schedules.length} horaire${schedules.length > 1 ? "s" : ""}`}
              </span>
            </div>
            {(() => {
              const grouped = schedules.reduce<Record<string, Schedule[]>>(
                (acc, s) => {
                  const k = toLocalDateKey(new Date(s.date));
                  if (!acc[k]) acc[k] = [];
                  acc[k].push(s);
                  return acc;
                },
                {},
              );
              return Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, daySchedules]) => {
                  const [y, mo, da] = dateKey.split("-").map(Number);
                  const d = new Date(y!, mo! - 1, da!);
                  const isToday =
                    d.toDateString() === new Date().toDateString();
                  const isTomorrow =
                    d.toDateString() ===
                    new Date(Date.now() + 86400000).toDateString();
                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-3 py-2">
                        <div
                          className={`text-xs font-bold px-3 py-1.5 rounded-full ${isToday ? "bg-primary text-black" : isTomorrow ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          {isToday
                            ? "Aujourd'hui"
                            : isTomorrow
                              ? "Demain"
                              : d.toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}
                        </div>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-semibold">
                          {daySchedules.length} voyage
                          {daySchedules.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {daySchedules
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((s) => (
                            <ScheduleCard
                              key={s._id}
                              schedule={s}
                              onEdit={() => setModalSchedule(s)}
                              onDelete={(id) => setDeleteTarget(id)}
                              onStatusChange={(id, status) =>
                                statusMutation.mutate({ id, status })
                              }
                              onAssignDriver={(sc) => setAssignTarget(sc)}
                              onViewPassengers={(sc) => setPassengerTarget(sc)}
                              selected={selectedIds.has(s._id)}
                              onSelect={toggleSelect}
                            />
                          ))}
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalSchedule !== null && (
        <ScheduleModal
          schedule={modalSchedule === "new" ? null : modalSchedule}
          routes={routes}
          drivers={drivers}
          onClose={() => setModalSchedule(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
          }
        />
      )}
      {assignTarget !== null && (
        <AssignDriverModal
          scheduleId={assignTarget._id}
          currentDriver={getDriverObj(assignTarget.driver)}
          onClose={() => setAssignTarget(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
          }
        />
      )}
      {passengerTarget !== null && (
        <PassengerModal
          schedule={passengerTarget}
          onClose={() => setPassengerTarget(null)}
        />
      )}
      {deleteTarget !== null && (
        <DeleteModal
          count={deleteTarget === "bulk" ? selectedIds.size : 1}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
