import {
  ArrowRight,
  Calendar,
  ChevronDown,
  MapPin,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/hero.webp";
import { useAvailableRoutes } from "../hooks/useAvailableRoutes";
import { useReservationTempStore } from "../stores/reservationStore";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export const Hero = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const { availableDepartures, getAvailableDestinations } =
    useAvailableRoutes();
  const { setTripDetails } = useReservationTempStore();
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today);
  const ticketsSold = useCountUp(2847);

  const handleSearch = () => {
    if (!departure || !destination || departure === destination) return;
    setTripDetails({ departure, destination, date, time: "", price: 0 });
    navigate("/reservation");
  };

  return (
    <section className="relative bg-[#0a0a0a] overflow-hidden h-dvh flex flex-col">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={hero}
          alt="Transport Cotram"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/50 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Content — takes remaining space, centers vertically */}
      <div className="relative flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 md:px-8 w-full pt-20 pb-4">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Star size={11} fill="currentColor" />
            Transport Premium — Madagascar
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-4">
            Voyagez
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-amber-300">
              en confiance
            </span>
            vers le sud
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl leading-relaxed mb-6">
            Antananarivo • Ambatolampy • Antsirabe. Réservez votre siège en
            ligne, voyagez avec ponctualité et confort.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: <Zap size={12} />, label: "Réservation instantanée" },
              { icon: <Shield size={12} />, label: "Paiement sécurisé" },
              { icon: <Star size={12} />, label: "Confort garanti" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full text-xs"
              >
                {f.icon}
                {f.label}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mb-8">
            {[
              { value: "3", label: "Villes" },
              { value: "6+", label: "Départs/jour" },
              { value: "16", label: "Places" },
              { value: ticketsSold.toLocaleString(), label: "Billets vendus" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-black text-primary">
                  {stat.value}
                </div>
                <div className="text-white/40 text-[10px] md:text-xs">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">
                  Départ
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <select
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white pl-8 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                  >
                    <option value="" className="bg-gray-900">
                      Sélectionnez
                    </option>
                    {availableDepartures.map((dep) => (
                      <option key={dep} value={dep} className="bg-gray-900">
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">
                  Destination
                </label>
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white pl-8 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                  >
                    <option value="" className="bg-gray-900">
                      Sélectionnez
                    </option>
                    {getAvailableDestinations(departure).map((dest) => (
                      <option key={dest} value={dest} className="bg-gray-900">
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="block text-white/40 text-[10px] mb-1 font-semibold uppercase tracking-wider">
                  Date
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                  />
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white pl-8 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors scheme-dark"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSearch}
                disabled={!departure || !destination || departure === destination}
                className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <ArrowRight size={16} />
                Rechercher
              </button>
              <button
                onClick={() => navigate("/reservation")}
                className="bg-white/5 border border-white/10 text-white/80 font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition-all text-sm whitespace-nowrap"
              >
                Voir les horaires
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-white/20 animate-bounce">
        <ChevronDown size={16} />
      </div>
    </section>
  );
};
