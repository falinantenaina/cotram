import { ArrowRight, Calendar, Clock, MapPin, RotateCcw } from "lucide-react";
import type { Step } from "../../type";

type Props = {
  departure: string;
  setDeparture: React.Dispatch<React.SetStateAction<string>>;
  destination: string;
  setDestination: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
};

const cities = ["Antananarivo", "Antsirabe", "Ambatolampy"];

const quickDates = [
  { label: "Aujourd'hui", value: 0 },
  { label: "Demain", value: 1 },
  { label: "Dans 2 jours", value: 2 },
];

export const RouteStep = (props: Props) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const isToday = props.selectedDate === todayStr;
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  // Format HH:MM pour affichage
  const nowStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  const handleSwap = () => {
    const tmp = props.departure;
    props.setDeparture(props.destination);
    props.setDestination(tmp);
  };

  const setQuickDate = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    props.setSelectedDate(d.toISOString().split("T")[0]);
  };

  const canContinue =
    props.departure &&
    props.destination &&
    props.departure !== props.destination;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Form body */}
        <div className="p-6 md:p-8 space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Choisissez votre trajet
          </h2>

          {/* Departure / Destination */}
          <div className="relative space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Départ
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={props.departure}
                  onChange={(e) => props.setDeparture(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white appearance-none"
                >
                  <option value="">Sélectionnez un lieu de départ</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                disabled={!props.departure || !props.destination}
                className="size-9 flex items-center justify-center bg-gray-100 hover:bg-primary/10 hover:text-primary border border-gray-200 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Inverser départ/destination"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Destination
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={props.destination}
                  onChange={(e) => props.setDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white appearance-none"
                >
                  <option value="">Sélectionnez une destination</option>
                  {cities
                    .filter((c) => c !== props.departure)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Same city warning */}
          {props.departure &&
            props.destination &&
            props.departure === props.destination && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                Le départ et la destination doivent être différents.
              </p>
            )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Date de départ
            </label>

            {/* Quick date buttons */}
            <div className="flex gap-2 mb-3">
              {quickDates.map((qd) => {
                const d = new Date();
                d.setDate(d.getDate() + qd.value);
                const val = d.toISOString().split("T")[0];
                return (
                  <button
                    key={qd.label}
                    onClick={() => setQuickDate(qd.value)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      props.selectedDate === val
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {qd.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="date"
                value={props.selectedDate}
                onChange={(e) => props.setSelectedDate(e.target.value)}
                min={today.toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 pb-8">
          {/* Info banner when today is selected */}
          {isToday && (
            <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Il est actuellement <strong>{nowStr}</strong>. Seuls les départs
                après cette heure seront affichés.
              </p>
            </div>
          )}

          <button
            onClick={() => props.setCurrentStep("time")}
            disabled={!canContinue}
            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? "bg-primary text-black hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Voir les horaires disponibles
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
