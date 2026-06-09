import { useQuery } from "@tanstack/react-query";
import {
  Bus,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Shield,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import api from "../../lib/axios";

interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  totalTrips: number;
  joinedAt: string;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
}

interface DriverStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  thisMonth: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  available: { label: "Disponible", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  on_trip: { label: "En trajet", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  off_duty: { label: "Hors service", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  suspended: { label: "Suspendu", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const VEHICLE_ICONS: Record<string, string> = {
  Crafter: "🚐",
  Sprinter: "🚌",
  Transit: "🚐",
};

export default function DriverProfile() {
  const { data: profile, isLoading: loadingProfile } = useQuery<DriverProfile>({
    queryKey: ["driver-profile"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/profile");
      return data.driver;
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery<DriverStats>({
    queryKey: ["driver-stats"],
    queryFn: async () => {
      const { data } = await api.get("/drivers/me/stats");
      return data.stats;
    },
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Profil introuvable</p>
      </div>
    );
  }

  const st = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.available;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Mon profil
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vos informations personnelles
          </p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Avatar + name */}
          <div className="bg-linear-to-br from-dark-gray to-gray-800 px-6 py-8 text-center">
            <div className="size-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <span className="text-3xl font-black text-black">
                {profile.firstName[0]}{profile.lastName[0]}
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-white/50 text-sm mt-1">{profile.user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${st.cls}`}>
                <span className={`size-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="divide-y divide-gray-50">
            <InfoRow icon={User} label="Nom complet" value={`${profile.firstName} ${profile.lastName}`} />
            <InfoRow icon={Mail} label="Email" value={profile.user.email} />
            <InfoRow icon={Phone} label="Téléphone" value={profile.phone} />
            <InfoRow icon={FileText} label="N° Permis" value={profile.licenseNumber} />
            <InfoRow
              icon={Truck}
              label="Véhicule"
              value={`${VEHICLE_ICONS[profile.vehicleType] || "🚐"} ${profile.vehicleNumber} (${profile.vehicleType})`}
            />
            <InfoRow
              icon={Clock}
              label="Membre depuis"
              value={new Date(profile.joinedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            />
            {profile.notes && (
              <InfoRow icon={Shield} label="Notes" value={profile.notes} />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Statistiques</h3>
          {loadingStats ? (
            <div className="flex justify-center py-6">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total" value={stats?.total ?? 0} icon={<Bus size={14} />} color="text-blue-600 bg-blue-50" />
              <StatBox label="Terminés" value={stats?.completed ?? 0} icon={<CheckCircle size={14} />} color="text-emerald-600 bg-emerald-50" />
              <StatBox label="À venir" value={stats?.upcoming ?? 0} icon={<Clock size={14} />} color="text-amber-600 bg-amber-50" />
              <StatBox label="Annulés" value={stats?.cancelled ?? 0} icon={<XCircle size={14} />} color="text-red-600 bg-red-50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="size-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className={`size-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${color}`}>
        {icon}
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}
