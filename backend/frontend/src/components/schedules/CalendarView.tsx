import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { STATUS_CONFIG, type Schedule } from "./ScheduleCard";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Props {
  schedules: Schedule[];
  onEdit: (s: Schedule) => void;
}

export function CalendarView({ schedules, onEdit }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const byDate = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const k = toLocalDateKey(new Date(s.date));
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-gray-900 text-base sm:text-lg">
            {MONTHS_FR[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg"
          >
            Aujourd'hui
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-50">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const cellDate = isValid ? new Date(year, month, dayNum) : null;
          const dateKey = cellDate ? toLocalDateKey(cellDate) : "";
          const daySchedules = byDate[dateKey] ?? [];
          const isToday =
            cellDate?.toDateString() === new Date().toDateString();
          const isPast = cellDate ? cellDate < todayMid : false;

          return (
            <div
              key={i}
              className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-gray-50 ${!isValid ? "bg-gray-50/50" : isPast ? "bg-gray-50/30" : ""}`}
            >
              {isValid && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-black" : isPast ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {dayNum}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {daySchedules.slice(0, 3).map((s) => {
                      const cfg =
                        STATUS_CONFIG[s.status] ?? STATUS_CONFIG.scheduled;
                      return (
                        <button
                          key={s.id}
                          onClick={() => onEdit(s)}
                          className={`w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border hover:scale-[1.02] transition-all ${cfg.badge}`}
                        >
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`}
                          />
                          <span className="font-mono">{s.time}</span>
                          <span className="truncate opacity-70 hidden sm:inline">
                            {s.route.destination?.name}
                          </span>
                        </button>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1 font-semibold">
                        +{daySchedules.length - 3}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
