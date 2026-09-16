import { DollarSign, Ticket, UserCheck, TrendingDown } from "lucide-react";

interface FinanceKPIsProps {
  totalRevenue: number;
  paidReservations: number;
  avgTicket: number;
  cancelledReservations: number;
  isLoading?: boolean;
}

function formatMGA(amount: number): string {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
          {isLoading ? (
            <div className="h-6 bg-gray-100 rounded-lg mt-1 animate-pulse" />
          ) : (
            <p className="text-xl font-black text-gray-900 truncate">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function FinanceKPIs({
  totalRevenue,
  paidReservations,
  avgTicket,
  cancelledReservations,
  isLoading,
}: FinanceKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon={<DollarSign size={18} className="text-emerald-600" />}
        label="Revenue totale"
        value={formatMGA(totalRevenue)}
        color="bg-emerald-50"
        isLoading={isLoading}
      />
      <StatCard
        icon={<Ticket size={18} className="text-blue-600" />}
        label="Réservations payées"
        value={String(paidReservations)}
        color="bg-blue-50"
        isLoading={isLoading}
      />
      <StatCard
        icon={<UserCheck size={18} className="text-violet-600" />}
        label="Prix moyen / billet"
        value={formatMGA(avgTicket)}
        color="bg-violet-50"
        isLoading={isLoading}
      />
      <StatCard
        icon={<TrendingDown size={18} className="text-amber-600" />}
        label="Annulations"
        value={String(cancelledReservations)}
        color="bg-amber-50"
        isLoading={isLoading}
      />
    </div>
  );
}
