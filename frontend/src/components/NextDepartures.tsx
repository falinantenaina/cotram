import { ArrowRight, Clock4, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

interface ScheduleData {
  id: string;
  departureTime: string;
  route: {
    departure: { name: string };
    destination: { name: string };
    price: number;
    duration: string;
  };
  vehicle: { plateNumber: string };
  availableSeats: number;
}

export const NextDepartures = () => {
  const navigate = useNavigate();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["next-departures"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await api.get(
        `/schedules?date=${today}&status=AVAILABLE`,
      );
      return (data.schedules ?? data) as ScheduleData[];
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-4 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!schedules?.length) return null;

  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Aujourd'hui
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
              Prochains <span className="text-primary">départs</span>
            </h2>
          </div>
          <button
            onClick={() => navigate("/reservation")}
            className="self-start md:self-auto flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Voir tous les horaires
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.slice(0, 6).map((s) => (
            <div
              key={s.id}
              className="group bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-gray-900 font-semibold text-sm">
                    {s.route.departure.name}
                  </span>
                  <ArrowRight size={12} className="text-gray-300" />
                  <span className="text-gray-600 text-sm">
                    {s.route.destination.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock4 size={12} />
                  {s.departureTime}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  {s.route.duration}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-lg font-black text-primary">
                  {s.route.price.toLocaleString()}{" "}
                  <span className="text-xs font-semibold text-gray-400">Ar</span>
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s.availableSeats > 5
                      ? "bg-green-50 text-green-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {s.availableSeats} place{s.availableSeats > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
