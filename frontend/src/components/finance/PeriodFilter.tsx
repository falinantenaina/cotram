import type { FinancePeriod } from "../../hooks/useFinance";

interface PeriodFilterProps {
  value: FinancePeriod;
  onChange: (p: FinancePeriod) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}

const PERIODS: { value: FinancePeriod; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 jours" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "custom", label: "Personnalisé" },
];

export function PeriodFilter({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-gray-100 rounded-xl p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              value === p.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-gray-400 text-xs">à</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
    </div>
  );
}
