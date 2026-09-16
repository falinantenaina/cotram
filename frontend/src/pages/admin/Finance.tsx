import { useState } from "react";
import {
  useFinanceOverview,
  useRevenueChart,
  useRevenueByRoute,
  useDailyReport,
  type FinancePeriod,
} from "../../hooks/useFinance";
import { PeriodFilter } from "../../components/finance/PeriodFilter";
import { FinanceKPIs } from "../../components/finance/FinanceKPIs";
import { RevenueChart } from "../../components/finance/RevenueChart";
import { RouteRevenueChart } from "../../components/finance/RouteRevenueChart";
import { DailyReportTable } from "../../components/finance/DailyReportTable";
import { ExportButton } from "../../components/finance/ExportButton";

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Finance() {
  const [period, setPeriod] = useState<FinancePeriod>("month");
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toLocalDateStr(d);
  });
  const [customTo, setCustomTo] = useState(() => toLocalDateStr(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));

  const from = period === "custom" ? customFrom : undefined;
  const to = period === "custom" ? customTo : undefined;

  const overview = useFinanceOverview(period, from, to);
  const revenue = useRevenueChart(period, from, to);
  const routes = useRevenueByRoute(from, to);
  const daily = useDailyReport(selectedDate);

  const todayStr = toLocalDateStr(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Finance</h1>
            <p className="text-gray-500 text-sm mt-1">
              Suivi des revenus et rapports financiers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              data={revenue.data?.map((d) => ({
                Date: d.date,
                Revenue: d.revenue,
                Réservations: d.reservations,
              })) ?? []}
              filename={`revenue_${period}_${todayStr}`}
              type="csv"
              disabled={!revenue.data?.length}
            />
            <ExportButton
              data={daily.data?.schedules.map((s) => ({
                Heure: s.time,
                Itinéraire: s.route,
                Chauffeur: s.driver,
                Places: `${s.occupied}/${s.totalSeats}`,
                Occupation: `${s.occupancyRate}%`,
                Statut: s.status,
                Revenue: s.revenue,
              })) ?? []}
              filename={`rapport_${selectedDate}`}
              type="pdf"
              disabled={!daily.data?.schedules.length}
            />
          </div>
        </div>

        {/* Period filter */}
        <PeriodFilter
          value={period}
          onChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />

        {/* KPIs */}
        <FinanceKPIs
          totalRevenue={overview.data?.totalRevenue ?? 0}
          paidReservations={overview.data?.paidReservations ?? 0}
          avgTicket={overview.data?.avgTicket ?? 0}
          cancelledReservations={overview.data?.cancelledReservations ?? 0}
          isLoading={overview.isLoading}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueChart data={revenue.data ?? []} isLoading={revenue.isLoading} />
          </div>
          <div>
            <RouteRevenueChart data={routes.data ?? []} isLoading={routes.isLoading} />
          </div>
        </div>

        {/* Daily report */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-bold text-gray-900">Rapport journalier</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={todayStr}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {daily.data && (
            <DailyReportTable
              schedules={daily.data.schedules}
              summary={daily.data.summary}
              isLoading={daily.isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
