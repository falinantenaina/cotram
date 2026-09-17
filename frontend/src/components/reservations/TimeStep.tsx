import { ArrowRight, Clock, Loader, Users } from "lucide-react";
import type { Schedule } from "../../api/scheduleApi";

type Props = {
  departure: string;
  destination: string;
  selectedDate: string;
  selectedSchedule: Schedule;
  setSelectedSchedule: (schedule: Schedule) => void;
  schedules: Schedule[];
  isLoading: boolean;
};

export const TimeStep = (props: Props) => {
  const displayDate = new Date(
    props.selectedDate + "T00:00:00",
  ).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 md:px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">
            {props.departure}
          </span>
          <ArrowRight size={14} />
          <span className="font-semibold text-gray-700">
            {props.destination}
          </span>
          <span className="text-gray-300">·</span>
          <span className="capitalize">{displayDate}</span>
        </div>
      </div>

      {/* Schedules */}
      <div className="p-5 md:p-6">
        {props.isLoading ? (
          <div className="flex flex-col items-center py-12">
            <Loader size={28} className="text-primary animate-spin mb-3" />
            <p className="text-gray-400 text-sm">
              Recherche des horaires disponibles...
            </p>
          </div>
        ) : props.schedules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <div className="text-3xl mb-3">🕐</div>
            <p className="text-gray-700 font-semibold mb-1">
              {props.selectedDate === new Date().toISOString().split("T")[0]
                ? "Plus de départs disponibles aujourd'hui"
                : "Aucun horaire disponible"}
            </p>
            <p className="text-gray-400 text-sm">
              {props.selectedDate === new Date().toISOString().split("T")[0]
                ? "Tous les départs d'aujourd'hui sont déjà partis. Essayez demain !"
                : "Essayez une autre date ou un autre trajet"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-4">
              {props.schedules.length} horaire
              {props.schedules.length > 1 ? "s" : ""} disponible
              {props.schedules.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {props.schedules.map((schedule) => {
                const isSelected =
                  props.selectedSchedule?.id === schedule.id;
                const isFull = schedule.availableSeats === 0;

                return (
                  <button
                    key={schedule.id}
                    onClick={() =>
                      !isFull && props.setSelectedSchedule(schedule)
                    }
                    disabled={isFull}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                        : isFull
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-primary/40 hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 size-5 bg-primary rounded-full flex items-center justify-center">
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1.5"
                            stroke="black"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-2xl font-black text-gray-900">
                        {schedule.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users size={13} />
                        <span>
                          {schedule.availableSeats} place
                          {schedule.availableSeats > 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {schedule.price.toLocaleString()} Ar
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          schedule.availableSeats > 8
                            ? "bg-emerald-400"
                            : schedule.availableSeats > 3
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{
                          width: `${(schedule.availableSeats / schedule.totalSeats) * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
