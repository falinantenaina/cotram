// frontend/src/pages/admin/Drivers.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bus,
  CalendarDays,
  Check,
  ChevronRight,
  Edit3,
  FileText,
  Hash,
  Loader,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  totalTrips: number;
  joinedAt: string;
  notes?: string;
}

interface Schedule {
  _id: string;
  route: {
    departure: string;
    destination: string;
    duration: string;
    price: number;
  };
  date: string;
  time: string;
  vehicle: string;
  vehicleNumber: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: {
    label: "Disponible",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-300",
  },
  on_trip: {
    label: "En voyage",
    dot: "bg-blue-400 animate-pulse",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "ring-blue-300",
  },
  off_duty: {
    label: "Hors service",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-300",
  },
  suspended: {
    label: "Suspendu",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-200",
    ring: "ring-red-300",
  },
};

const TRIP_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  scheduled: {
    label: "Planifié",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  in_progress: {
    label: "En cours",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Terminé",
    badge: "bg-gray-50 text-gray-500 border-gray-200",
  },
  cancelled: {
    label: "Annulé",
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};

const VEHICLES = ["Crafter", "Sprinter", "Transit"];
const VEHICLE_ICONS: Record<string, string> = {
  Crafter: "🚌",
  Sprinter: "🚐",
  Transit: "🚐",
};

function getInitials(d: Driver) {
  return `${d.firstName ?? ""}${d.lastName ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-cyan-500 to-sky-600",
];

function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

// ─── Driver Modal ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  licenseNumber: "",
  vehicleNumber: "",
  vehicleType: "Crafter",
  status: "available" as Driver["status"],
  notes: "",
};

function DriverModal({
  driver,
  onClose,
  onSuccess,
}: {
  driver: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    driver
      ? {
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          status: driver.status,
          notes: driver.notes ?? "",
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (driver) return api.put(`/drivers/${driver._id}`, form);
      return api.post("/drivers", form);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputClass =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  {driver ? "Modifier le chauffeur" : "Nouveau chauffeur"}
                </p>
                <h2 className="font-black text-lg leading-tight">
                  {driver
                    ? `${driver.firstName} ${driver.lastName}`
                    : "Créer un profil"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle
                size={15}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Prénom
              </label>
              <input
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="Jean"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Nom
              </label>
              <input
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="Rakoto"
                className={inputClass}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Téléphone
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+261 34 00 000 00"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          {/* License */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Numéro de permis
            </label>
            <div className="relative">
              <Shield
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.licenseNumber}
                onChange={set("licenseNumber")}
                placeholder="MDG-2024-00001"
                className={`${inputClass} pl-9 font-mono`}
              />
            </div>
          </div>

          {/* Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Immatriculation
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={form.vehicleNumber}
                  onChange={set("vehicleNumber")}
                  placeholder="1234 TA"
                  className={`${inputClass} pl-9 font-mono uppercase`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Type véhicule
              </label>
              <select
                value={form.vehicleType}
                onChange={set("vehicleType")}
                className={`${inputClass} bg-white`}
              >
                {VEHICLES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (edit only) */}
          {driver && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Statut
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as Driver["status"][]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      form.status === s
                        ? "border-primary bg-primary text-black"
                        : `border-gray-200 ${STATUS_CONFIG[s].badge}`
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="Remarques sur ce chauffeur…"
              className={`${inputClass} resize-none`}
            />
          </div>
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
              !form.firstName ||
              !form.lastName ||
              !form.phone ||
              !form.licenseNumber ||
              !form.vehicleNumber ||
              mutation.isPending
            }
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 transition-all"
          >
            {mutation.isPending ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {driver ? "Sauvegarder" : "Créer le chauffeur"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Driver Detail Panel ───────────────────────────────────────────────────────
function DriverPanel({
  driver,
  onEdit,
  onClose,
}: {
  driver: Driver;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-detail", driver._id],
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driver._id}`);
      return data;
    },
  });

  const cfg = STATUS_CONFIG[driver.status];
  const color = getAvatarColor(driver._id);

  const trips: Schedule[] = data?.schedules ?? [];
  const completed = trips.filter((t) => t.status === "completed").length;
  const upcoming = trips.filter((t) => t.status === "scheduled").length;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 px-6 py-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 bg-primary text-black text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90"
            >
              <Edit3 size={12} /> Modifier
            </button>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className={`size-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xl`}
            >
              {getInitials(driver)}
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {driver.firstName} {driver.lastName}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mt-1.5 ${cfg.badge}`}
              >
                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: "Total voyages", value: trips.length },
              { label: "Terminés", value: completed },
              { label: "À venir", value: upcoming },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/10 rounded-xl p-3 text-center"
              >
                <p className="text-2xl font-black">{value}</p>
                <p className="text-white/50 text-[10px] font-semibold mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-5 space-y-3 border-b border-gray-50">
          {[
            { icon: Phone, label: "Téléphone", value: driver.phone },
            { icon: Shield, label: "Permis", value: driver.licenseNumber },
            {
              icon: Hash,
              label: "Immatriculation",
              value: driver.vehicleNumber,
            },
            {
              icon: Bus,
              label: "Véhicule",
              value: `${VEHICLE_ICONS[driver.vehicleType] ?? "🚌"} ${driver.vehicleType}`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm font-bold text-gray-900 font-mono">
                  {value}
                </p>
              </div>
            </div>
          ))}
          {driver.notes && (
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Notes
                </p>
                <p className="text-sm text-gray-600">{driver.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Trip history */}
        <div className="flex-1 px-6 py-5">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            Historique des voyages
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader size={20} className="animate-spin text-gray-300" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Aucun voyage enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((t) => {
                const tCfg = TRIP_STATUS_CONFIG[t.status] ?? {
                  label: t.status,
                  badge: "bg-gray-50 text-gray-500 border-gray-200",
                };
                const d = new Date(t.date + "T00:00:00");
                return (
                  <div
                    key={t._id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all"
                  >
                    <div className="text-center shrink-0 w-10">
                      <p className="text-lg font-black text-gray-900 leading-none font-mono">
                        {t.time}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {d.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {t.route.departure} → {t.route.destination}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t.vehicleNumber || t.vehicle}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${tCfg.badge}`}
                    >
                      {tCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Driver Card ──────────────────────────────────────────────────────────────
function DriverCard({
  driver,
  onEdit,
  onDelete,
  onClick,
}: {
  driver: Driver;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[driver.status];
  const color = getAvatarColor(driver._id);
  const initials = getInitials(driver);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Top gradient */}
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-lg shadow-md`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">
                {driver.firstName} {driver.lastName}
              </h3>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${cfg.badge}`}
              >
                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={11} className="text-gray-400 shrink-0" />
            <span>{driver.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-1">
              <Hash size={11} className="text-gray-400 shrink-0" />
              <span className="font-mono font-bold text-gray-700">
                {driver.vehicleNumber}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {VEHICLE_ICONS[driver.vehicleType]} {driver.vehicleType}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp size={11} />
            <span>
              <span className="font-bold text-gray-700">
                {driver.totalTrips}
              </span>{" "}
              voyages
            </span>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Voir détails <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDrivers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<Driver | null | "new">(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setDeleteId(null);
    },
  });

  const drivers = (data?.drivers ?? []).filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.vehicleNumber.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: data?.drivers.length ?? 0,
    available:
      data?.drivers.filter((d) => d.status === "available").length ?? 0,
    on_trip: data?.drivers.filter((d) => d.status === "on_trip").length ?? 0,
    off_duty: data?.drivers.filter((d) => d.status === "off_duty").length ?? 0,
    suspended:
      data?.drivers.filter((d) => d.status === "suspended").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Chauffeurs</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {counts.all} chauffeur{counts.all !== 1 ? "s" : ""} ·{" "}
                <span className="text-emerald-600 font-semibold">
                  {counts.available} disponibles
                </span>
              </p>
            </div>
            <button
              onClick={() => setModal("new")}
              className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <Plus size={15} /> Nouveau chauffeur
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              key: "available",
              label: "Disponibles",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              key: "on_trip",
              label: "En voyage",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              key: "off_duty",
              label: "Hors service",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              key: "suspended",
              label: "Suspendus",
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map(({ key, label, color, bg }) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className={`text-3xl font-black ${color}`}>
                {counts[key as keyof typeof counts]}
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Chercher par nom, téléphone, immatriculation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
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

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {(
              ["all", "available", "on_trip", "off_duty", "suspended"] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="size-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <User size={24} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-600 mb-2">
              Aucun chauffeur trouvé
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Commencez par enregistrer un chauffeur
            </p>
            <button
              onClick={() => setModal("new")}
              className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
            >
              <Plus size={15} /> Ajouter un chauffeur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {drivers.map((d) => (
              <DriverCard
                key={d._id}
                driver={d}
                onEdit={() => setModal(d)}
                onDelete={() => setDeleteId(d._id)}
                onClick={() => setDetailDriver(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal !== null && (
        <DriverModal
          driver={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["drivers"] })
          }
        />
      )}

      {detailDriver && !modal && (
        <DriverPanel
          driver={detailDriver}
          onEdit={() => {
            setModal(detailDriver);
            setDetailDriver(null);
          }}
          onClose={() => setDetailDriver(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="size-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              Supprimer ce chauffeur ?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Il sera retiré de tous les voyages planifiés. Les voyages passés
              resteront dans l'historique.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
