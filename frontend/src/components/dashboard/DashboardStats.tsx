import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Ticket, TrendingUp, Users } from "lucide-react";
import api from "../../lib/axios";
import { StatCard } from "../common";

interface AdminStats {
  todayReservations: number;
  totalUsers: number;
  activeRoutes: number;
  monthlyRevenue: number;
  pendingCount: number;
}

export function DashboardStats() {
  const { data } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data;
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Réservations aujourd'hui"
        value={data?.todayReservations ?? "—"}
        icon={Ticket}
        accent="bg-yellow-100 text-yellow-700"
      />
      <StatCard
        label="Revenus du mois"
        value={data ? `${(data.monthlyRevenue / 1000).toFixed(0)}k Ar` : "—"}
        icon={TrendingUp}
        accent="bg-emerald-100 text-emerald-700"
      />
      <StatCard
        label="Clients inscrits"
        value={data?.totalUsers ?? "—"}
        icon={Users}
        accent="bg-blue-100 text-blue-700"
      />
      <StatCard
        label="En attente"
        value={data?.pendingCount ?? "—"}
        icon={AlertCircle}
        accent="bg-red-100 text-red-700"
        sub={data?.pendingCount ? "À traiter" : undefined}
      />
    </div>
  );
}
