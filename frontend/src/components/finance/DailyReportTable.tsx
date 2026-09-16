import { Clock, MapPin, User, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface DailySchedule {
  id: string;
  time: string;
  route: string;
  driver: string;
  vehicle: string;
  totalSeats: number;
  occupied: number;
  occupancyRate: number;
  status: string;
  revenue: number;
}

interface DailyReportTableProps {
  schedules: DailySchedule[];
  summary: {
    totalSchedules: number;
    totalRevenue: number;
    totalPassengers: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
  };
  isLoading?: boolean;
}

function formatMGA(amount: number): string {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    completed: "Terminé",
    scheduled: "Programmé",
    in_progress: "En cours",
    cancelled: "Annulé",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {labels[status] || status}
    </span>
  );
}

export function DailyReportTable({ schedules, summary, isLoading }: DailyReportTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="h-5 bg-gray-100 rounded-lg w-48 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-gray-900">Rapport du jour</h3>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
            <CheckCircle size={12} className="text-emerald-500" />
            {summary.confirmedReservations} confirmées
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
            <AlertCircle size={12} className="text-amber-500" />
            {summary.pendingReservations} en attente
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
            <XCircle size={12} className="text-red-500" />
            {summary.cancelledReservations} annulées
          </span>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Aucun voyage programmé pour cette date
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-semibold pr-4">Heure</th>
                <th className="pb-2 font-semibold pr-4">Itinéraire</th>
                <th className="pb-2 font-semibold pr-4">Chauffeur</th>
                <th className="pb-2 font-semibold pr-4 text-center">Places</th>
                <th className="pb-2 font-semibold pr-4 text-center">Statut</th>
                <th className="pb-2 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-gray-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} className="text-gray-400" />
                      {s.time}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <MapPin size={11} className="text-gray-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{s.route}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <User size={11} className="text-gray-400" />
                      {s.driver}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-center">
                    <span className="font-medium text-gray-900">{s.occupied}</span>
                    <span className="text-gray-400">/{s.totalSeats}</span>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div
                        className={`h-1 rounded-full ${
                          s.occupancyRate >= 80 ? "bg-emerald-500" : s.occupancyRate >= 50 ? "bg-amber-500" : "bg-gray-300"
                        }`}
                        style={{ width: `${s.occupancyRate}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {formatMGA(s.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
