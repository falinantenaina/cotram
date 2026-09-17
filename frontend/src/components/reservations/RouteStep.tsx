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
  { label: "Dans 2j", value: 2 },
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

  const sameCity =
    props.departure && props.destination && props.departure === props.destination;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 md:p-5">
        {/* Desktop: horizontal */}
        <div className="hidden md:flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Départ
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={props.departure}
                onChange={(e) => props.setDeparture(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white text-sm appearance-none"
              >
                <option value="">Départ</option>
                {availableDepartures.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSwap}
            disabled={!props.departure || !props.destination}
            className="size-9 flex items-center justify-center bg-gray-100 hover:bg-primary/10 hover:text-primary border border-gray-200 rounded-full transition-all disabled:opacity-30 shrink-0 mb-0.5"
          >
            <RotateCcw size={14} />
          </button>

          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Destination
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={props.destination}
                onChange={(e) => props.setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 bg-white text-sm appearance-none"
              >
                <option value="">Destination</option>
                {getAvailableDestinations(props.departure).map((dest) => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={props.selectedDate}
                onChange={(e) => props.setSelectedDate(e.target.value)}
                min={todayStr}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-gray-900 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Départ
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={props.departure}
                onChange={(e) => props.setDeparture(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-white text-sm appearance-none"
              >
                <option value="">Départ</option>
                {availableDepartures.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              disabled={!props.departure || !props.destination}
              className="size-8 flex items-center justify-center bg-gray-100 rounded-full disabled:opacity-30"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Destination
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={props.destination}
                onChange={(e) => props.setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-white text-sm appearance-none"
              >
                <option value="">Destination</option>
                {getAvailableDestinations(props.departure).map((dest) => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={props.selectedDate}
                onChange={(e) => props.setSelectedDate(e.target.value)}
                min={todayStr}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Quick dates mobile */}
          <div className="flex gap-2">
            {quickDates.map((qd) => {
              const d = new Date();
              d.setDate(d.getDate() + qd.value);
              const val = d.toISOString().split("T")[0];
              return (
                <button
                  key={qd.label}
                  onClick={() => setQuickDate(qd.value)}
                  className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                    props.selectedDate === val
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  {qd.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick dates desktop */}
        <div className="hidden md:flex items-center gap-2 mt-3">
          {quickDates.map((qd) => {
            const d = new Date();
            d.setDate(d.getDate() + qd.value);
            const val = d.toISOString().split("T")[0];
            return (
              <button
                key={qd.label}
                onClick={() => setQuickDate(qd.value)}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                  props.selectedDate === val
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {qd.label}
              </button>
            );
          })}

          {isToday && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 ml-2">
              <Clock size={10} />
              Maintenant {nowStr}
            </span>
          )}

          {sameCity && (
            <span className="text-[10px] text-red-500 ml-2">
              Départ ≠ destination
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
