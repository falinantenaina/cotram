import { ArrowRight, Calendar, MapPin } from "lucide-react";
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

export const RouteStep = (props: Props) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-6">
          Choisissez votre trajet
        </h2>
        <div className="space-y-6">
          {/* Départ */}
          <div>
            <label htmlFor="departure" className="block font-semibold mb-2">
              Lieu de départ
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <select
                name=""
                id="departure"
                value={props.departure}
                onChange={(e) => props.setDeparture(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez un lieu de départ</option>
                <option value="Antananarivo">Antananarivo</option>
                <option value="Antsirabe">Antsirabe</option>
                <option value="ambatolampy">Ambatolampy</option>
              </select>
            </div>
          </div>

          {/* Destinaiton */}
          <div>
            <label htmlFor="destination" className="block font-semibold mb-2">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <select
                name=""
                id="destination"
                value={props.destination}
                onChange={(e) => props.setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez une destination</option>
                <option value="Antananarivo">Antananarivo</option>
                <option value="Antsirabe">Antsirabe</option>
                <option value="ambatolampy">Ambatolampy</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block font-semibold mb-2">
              Date de départ
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <input
                type="date"
                id="date"
                value={props.selectedDate}
                onChange={(e) => props.setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={() => props.setCurrentStep("time")}
            disabled={!props.destination || !props.departure}
            className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              props.destination && props.departure
                ? "bg-primary text-black hover:bg-primary/90 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Continuer</span>
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
