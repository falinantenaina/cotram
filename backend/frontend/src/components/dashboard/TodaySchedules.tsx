import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bus,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import api from "../../lib/axios";
import { OccupancyBar } from "../common";

export interface TodaySchedule {
  id: string;
  time: string;
  date: string;
  status: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  vehicle: string;
  route: { departure: { id: string; name: string }; destination: { id: string; name: string } };
  passengerCount: number;
}

interface Props {
  onSelectSchedule: (schedule: TodaySchedule) => void;
}

export function TodaySchedules({ onSelectSchedule }: Props) {
  const { data } = useQuery<{ schedules: TodaySchedule[] }>({
    queryKey: ["admin-today-schedules"],
    queryFn: async () => {
      const { data } = await api.get("/admin/today-schedules");
      return data;
    },
    refetchInterval: 30_000,
  });

  const todaySchedules = (data?.schedules ?? []).filter((s) => s.route != null);
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const upcoming = todaySchedules.filter((s) => s.time >= nowStr);
  const departed = todaySchedules.filter((s) => s.time < nowStr);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <h2 className="font-bold text-gray-900 text-sm sm:text-base">
            Voyages d'aujourd'hui
          </h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
            {todaySchedules.length}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
          <Activity size={11} className="text-emerald-500" />
          <span>Mise à jour en direct</span>
        </div>
      </div>

      {todaySchedules.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bus size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Aucun voyage aujourd'hui</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {upcoming.map((s) => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              onClick={onSelectSchedule}
              isActive
            />
          ))}
          {departed.map((s) => (
            <ScheduleRow key={s.id} schedule={s} onClick={onSelectSchedule} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  schedule,
  onClick,
  isActive = false,
}: {
  schedule: TodaySchedule;
  onClick: (s: TodaySchedule) => void;
  isActive?: boolean;
}) {
  const occupied = schedule.passengerCount;

  return (
    <button
      onClick={() => onClick(schedule)}
      className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-gray-50 transition-colors group text-left ${!isActive ? "opacity-50" : ""}`}
    >
      <div className="text-center shrink-0 w-12 sm:w-14">
        <p className="text-lg sm:text-xl font-black text-gray-900">
          {schedule.time}
        </p>
        <p
          className={`text-[9px] sm:text-[10px] font-semibold ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-100"} rounded px-1`}
        >
          {isActive ? "À venir" : "Parti"}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
          <MapPin size={11} className="text-gray-400 shrink-0" />
          <span className="truncate">{schedule.route.departure?.name}</span>
          <ArrowRight size={11} className="text-gray-300 shrink-0" />
          <span className="truncate">{schedule.route.destination?.name}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {schedule.vehicle}
        </p>
      </div>

      <div className="shrink-0 w-28 hidden md:block">
        <OccupancyBar value={occupied} max={schedule.totalSeats} />
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          {schedule.availableSeats}
          <span className="text-gray-400 font-normal text-xs"> libres</span>
        </p>
        <p className="text-xs text-gray-400">sur {schedule.totalSeats}</p>
      </div>

      <ChevronRight
        size={14}
        className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 hidden sm:block"
      />
    </button>
  );
}
