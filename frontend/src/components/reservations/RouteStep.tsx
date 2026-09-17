import { Calendar, Clock, MapPin, RotateCcw } from "lucide-react";
import { useAvailableRoutes } from "../../hooks/useAvailableRoutes";

type Props = {
  departure: string;
  setDeparture: React.Dispatch<React.SetStateAction<string>>;
  destination: string;
  setDestination: React.Dispatch<React.SetStateAction<string>>;
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
};

const quickDates = [
  { label: "Aujourd'hui", value: 0 },
  { label: "Demain", value: 1 },
  { label: "Dans 2 jours", value: 2 },
];

export const RouteStep = (props: Props) => {
  const { availableDepartures, getAvailableDestinations } =
    useAvailableRoutes();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const isToday = props.selectedDate === todayStr;
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
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

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 space-y-5">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          Choisissez votre trajet
        </h2>

        <div className="relative space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white appearance-none"
              >
                <option value="">Sélectionnez un lieu de départ</option>
                {availableDepartures.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white appearance-none"
              >
                <option value="">Sélectionnez une destination</option>
                {getAvailableDestinations(props.departure).map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {props.departure &&
          props.destination &&
          props.departure === props.destination && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
              Le départ et la destination doivent être différents.
            </p>
          )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Date de départ
          </label>

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
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900"
            />
          </div>
        </div>

        {isToday && (
          <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Il est actuellement <strong>{nowStr}</strong>. Seuls les départs
              après cette heure seront affichés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
