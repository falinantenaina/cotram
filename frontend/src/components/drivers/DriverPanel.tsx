import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  CalendarDays,
  Edit3,
  FileText,
  Hash,
  Loader,
  Phone,
  Shield,
  X,
} from "lucide-react";
import api from "../../lib/axios";
import {
  getAvatarColor,
  getInitials,
  STATUS_CONFIG,
  VEHICLE_ICONS,
  type Driver,
} from "./DriverCard";

interface Schedule {
  id: string;
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

const TRIP_STATUS: Record<string, { label: string; badge: string }> = {
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

interface Props {
  driver: Driver;
  onEdit: () => void;
  onClose: () => void;
}

export function DriverPanel({ driver, onEdit, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-detail", driver.id],
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driver.id}`);
      return data;
    },
  });

  const cfg = STATUS_CONFIG[driver.status];
  const color = getAvatarColor(driver.id);
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
        <div className="bg-gray-900 px-6 py-8 text-white shrink-0">
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

          <div className="flex items-center gap-4">
            <div
              className={`size-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xl shrink-0`}
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
              { label: "Total", value: trips.length },
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
                const tCfg = TRIP_STATUS[t.status] ?? TRIP_STATUS.completed;
                const d = new Date(t.date);
                return (
                  <div
                    key={t.id}
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
                        {t.route.departure?.name} → {t.route.destination?.name}
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
