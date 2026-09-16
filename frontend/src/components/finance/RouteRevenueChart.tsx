import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface RouteRevenueChartProps {
  data: { route: string; revenue: number; count: number }[];
  isLoading?: boolean;
}

const COLORS = ["#16a34a", "#2563eb", "#9333ea", "#ea580c", "#0891b2", "#e11d48", "#65a30d", "#c026d3"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.route}</p>
      <p className="text-gray-600">Revenue: {d.revenue.toLocaleString()} Ar</p>
      <p className="text-gray-600">Réservations: {d.count}</p>
    </div>
  );
}

function formatMGA(amount: number): string {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RouteRevenueChart({ data, isLoading }: RouteRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="h-5 bg-gray-100 rounded-lg w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue par itinéraire</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue par itinéraire</h3>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="revenue"
                nameKey="route"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-64">
          {data.map((item, i) => (
            <div key={item.route} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-600 truncate flex-1">{item.route}</span>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {formatMGA(item.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
