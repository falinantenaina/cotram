import { ChevronRight, Edit3, Hash, Phone, TrendingUp, Trash2 } from "lucide-react";
import { StatusBadge } from "../common";

export interface Driver {
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

export const STATUS_CONFIG: Record<Driver["status"], { label: string; dot: string; badge: string }> = {
  available: { label: "Disponible", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  on_trip: { label: "En voyage", dot: "bg-blue-400 animate-pulse", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  off_duty: { label: "Hors service", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  suspended: { label: "Suspendu", dot: "bg-red-400", badge: "bg-red-50 text-red-700 border-red-200" },
};

export const VEHICLE_ICONS: Record<string, string> = { Crafter: "🚌", Sprinter: "🚐", Transit: "🚐" };

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600", "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600", "from-cyan-500 to-sky-600",
];

export function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

export function getInitials(d: Driver) {
  return `${d.firstName[0] ?? ""}${d.lastName[0] ?? ""}`.toUpperCase();
}

interface Props {
  driver: Driver;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function DriverCard({ driver, onEdit, onDelete, onClick }: Props) {
  const cfg = STATUS_CONFIG[driver.status];
  const color = getAvatarColor(driver._id);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`size-11 sm:size-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}>
              {getInitials(driver)}
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight text-sm sm:text-base">
                {driver.firstName} {driver.lastName}
              </h3>
              <StatusBadge label={cfg.label} dot={cfg.dot} badge={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${cfg.badge}`} />
            </div>
          </div>
          {/* Action buttons */}
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onEdit} className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <Edit3 size={13} />
            </button>
            <button onClick={onDelete} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={11} className="text-gray-400 shrink-0" />
            <span>{driver.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-1">
              <Hash size={11} className="text-gray-400 shrink-0" />
              <span className="font-mono font-bold text-gray-700">{driver.vehicleNumber}</span>
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
            <span><span className="font-bold text-gray-700">{driver.totalTrips}</span> voyages</span>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Voir détails <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
