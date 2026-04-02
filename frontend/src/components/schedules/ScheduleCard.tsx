import {
  ArrowRight,
  Bus,
  Check,
  Edit3,
  Layers,
  MoreHorizontal,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OccupancyBar, StatusBadge } from "../common";

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
}

export interface Schedule {
  _id: string;
  route: {
    _id: string;
    departure: string;
    destination: string;
    duration: string;
    price: number;
    phone: string;
  };
  driver?: Driver | string | null;
  vehicleNumber?: string | null;
  date: string;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  seatConfig?: { totalSeats: number; rows: any[] } | null;
}

export const STATUS_CONFIG = {
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

const ROUTE_COLORS = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
];
const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function hashColor(arr: string[], id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return arr[Math.abs(h) % arr.length] ?? arr[0]!;
}

export function getDriverObj(
  driver: Driver | string | null | undefined,
): Driver | null {
  if (!driver || typeof driver === "string") return null;
  return driver;
}

interface Props {
  schedule: Schedule;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAssignDriver: (s: Schedule) => void;
  onViewPassengers: (s: Schedule) => void;
}

export function ScheduleCard({
  schedule,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignDriver,
  onViewPassengers,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[schedule.status] ?? STATUS_CONFIG.scheduled;
  const occupiedCount = schedule.totalSeats - schedule.availableSeats;
  const routeColor = hashColor(
    ROUTE_COLORS,
    schedule.route?._id ?? schedule._id,
  );
  const depDate = new Date(schedule.date);
  const isToday = depDate.toDateString() === new Date().toDateString();
  const isPast = depDate < new Date() && !isToday;

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
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${schedule.status === "in_progress" ? "from-blue-400 to-blue-600 animate-pulse" : `${routeColor} opacity-70`}`}
      />

      {/* In progress badge */}
      {schedule.status === "in_progress" && (
        <div className="absolute top-2 right-12 flex items-center gap-1.5 bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-10">
          <span className="relative flex size-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full size-1.5 bg-white" />
          </span>
          EN COURS
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 pl-5 sm:pl-6 flex-wrap sm:flex-nowrap">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(schedule._id)}
          className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-primary bg-primary" : "border-gray-300 hover:border-primary/50"}`}
        >
          {selected && <Check size={11} className="text-black" />}
        </button>

        {/* Time + date */}
        <div className="w-16 sm:w-20 shrink-0">
          <span className="text-lg sm:text-xl font-black text-gray-900 font-mono leading-none">
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

        {/* Route */}
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
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Bus size={10} /> {schedule.vehicleNumber || schedule.vehicle}
            </span>
            {schedule.seatConfig && (
              <span className="text-xs text-primary font-bold flex items-center gap-1">
                <Layers size={9} /> {schedule.seatConfig.totalSeats}p
              </span>
            )}
          </div>
        </div>

        {/* Driver (hidden on small) */}
        <div className="w-32 xl:w-36 shrink-0 hidden xl:block">
          {(() => {
            const d = getDriverObj(schedule.driver);
            return d ? (
              <button
                onClick={() => onAssignDriver(schedule)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
              >
                <div
                  className={`size-7 rounded-lg bg-gradient-to-br ${hashColor(AVATAR_COLORS, d._id)} flex items-center justify-center text-white text-[10px] font-black shrink-0`}
                >
                  {d.firstName[0]}
                  {d.lastName[0]}
                </div>
                <div className="min-w-0">
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

        {/* Occupancy */}
        <div className="w-28 shrink-0 hidden lg:block">
          <button
            onClick={() => onViewPassengers(schedule)}
            className="w-full text-left hover:opacity-70"
          >
            <OccupancyBar value={occupiedCount} max={schedule.totalSeats} />
          </button>
        </div>

        {/* Price */}
        <div className="w-20 sm:w-24 text-right shrink-0 hidden md:block">
          <p className="font-black text-gray-900 text-sm">
            {schedule.price.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal ml-0.5">Ar</span>
          </p>
        </div>

        {/* Status badge */}
        <div className="shrink-0 hidden sm:block">
          <StatusBadge label={cfg.label} dot={cfg.dot} badge={cfg.badge} />
        </div>

        {/* Context menu */}
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
                <MenuBtn
                  icon={Edit3}
                  label="Modifier"
                  onClick={() => {
                    onEdit(schedule);
                    setMenuOpen(false);
                  }}
                />
                <MenuBtn
                  icon={User}
                  label={
                    schedule.driver ? "Changer chauffeur" : "Assigner chauffeur"
                  }
                  onClick={() => {
                    onAssignDriver(schedule);
                    setMenuOpen(false);
                  }}
                />
                <MenuBtn
                  icon={Users}
                  label="Voir les passagers"
                  onClick={() => {
                    onViewPassengers(schedule);
                    setMenuOpen(false);
                  }}
                />
                {schedule.status === "scheduled" && (
                  <>
                    <MenuBtn
                      icon={Zap}
                      label="Démarrer"
                      color="text-blue-600"
                      hoverBg="hover:bg-blue-50"
                      onClick={() => {
                        onStatusChange(schedule._id, "in_progress");
                        setMenuOpen(false);
                      }}
                    />
                    <MenuBtn
                      icon={X}
                      label="Annuler"
                      color="text-red-600"
                      hoverBg="hover:bg-red-50"
                      onClick={() => {
                        onStatusChange(schedule._id, "cancelled");
                        setMenuOpen(false);
                      }}
                    />
                  </>
                )}
                {schedule.status === "in_progress" && (
                  <MenuBtn
                    icon={Check}
                    label="Marquer terminé"
                    color="text-emerald-600"
                    hoverBg="hover:bg-emerald-50"
                    onClick={() => {
                      onStatusChange(schedule._id, "completed");
                      setMenuOpen(false);
                    }}
                  />
                )}
                {schedule.status === "cancelled" && (
                  <MenuBtn
                    icon={Check}
                    label="Réactiver"
                    color="text-emerald-600"
                    hoverBg="hover:bg-emerald-50"
                    onClick={() => {
                      onStatusChange(schedule._id, "scheduled");
                      setMenuOpen(false);
                    }}
                  />
                )}
              </div>
              <div className="border-t border-gray-100 p-1">
                <MenuBtn
                  icon={Trash2}
                  label="Supprimer"
                  color="text-red-500"
                  hoverBg="hover:bg-red-50"
                  onClick={() => {
                    onDelete(schedule._id);
                    setMenuOpen(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  color = "text-gray-700",
  hoverBg = "hover:bg-gray-50",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
  hoverBg?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm ${color} ${hoverBg} rounded-lg`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
