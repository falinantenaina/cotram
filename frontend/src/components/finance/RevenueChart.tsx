import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
  Line,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number; reservations: number }[];
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{formatDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-gray-600">
          <span
            className="inline-block size-2 rounded-full mr-1.5"
            style={{ backgroundColor: p.color }}
          />
          {p.dataKey === "revenue"
            ? `Revenue: ${Number(p.value).toLocaleString()} Ar`
            : `Réservations: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
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
        <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue quotidienne</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Aucune donnée pour cette période
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue quotidienne</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="revenue"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
              }
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value: string) =>
                value === "revenue" ? "Revenue (Ar)" : "Réservations"
              }
            />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
              barSize={data.length > 15 ? 12 : 24}
              name="revenue"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="reservations"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="reservations"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
