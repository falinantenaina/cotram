import {
  ArrowRight,
  Calendar,
  ChevronDown,
  MapPin,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/hero.webp";
import { useCities } from "../hooks/useCities";
import { useReservationTempStore } from "../stores/reservationStore";

export const Hero = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const { cities } = useCities();
  const { setTripDetails } = useReservationTempStore();
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today);

  const handleSearch = () => {
    if (!departure || !destination || departure === destination) return;
    setTripDetails({ departure, destination, date, time: "", price: 0 });
    navigate("/reservation");
  };

  return (
    <section className="relative bg-[#0a0a0a] overflow-hidden min-h-[92vh] flex flex-col">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={hero}
          alt="Transport Cotram"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/60 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Decorative glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8 w-full">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Star size={11} fill="currentColor" />
            Transport Premium — Madagascar
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Voyagez
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-amber-300">
              en confiance
            </span>
            vers le sud
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
            Antananarivo • Ambatolampy • Antsirabe. Réservez votre siège en
            ligne, voyagez avec ponctualité et confort.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { icon: <Zap size={13} />, label: "Réservation instantanée" },
              { icon: <Shield size={13} />, label: "Paiement sécurisé" },
              { icon: <Star size={13} />, label: "Confort garanti" },
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/reservation")}
              className="group flex items-center justify-center gap-2 bg-primary text-black font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-95 text-base"
            >
              <Calendar size={18} />
              Réserver maintenant
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("search-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80 font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base"
            >
              Voir les horaires
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-auto pt-16 grid grid-cols-3 gap-4 max-w-md">
          {[
            { value: "3", label: "Villes desservies" },
            { value: "6+", label: "Départs/jour" },
            { value: "16", label: "Places par bus" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-primary">
                {stat.value}
              </div>
              <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div
        id="search-form"
        className="relative max-w-7xl mx-auto px-4 md:px-8 w-full pb-12"
      >
        <div className="bg-white/4 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
            Rechercher un trajet
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="block text-white/40 text-xs mb-1.5 font-medium">
                Départ
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <select
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    Sélectionnez
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name} className="bg-gray-900">
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="relative">
              <label className="block text-white/40 text-xs mb-1.5 font-medium">
                Destination
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    Sélectionnez
                  </option>
                  {cities
                    .filter((c) => c.name !== departure)
                    .map((city) => (
                      <option key={city.id} value={city.name} className="bg-gray-900">
                        {city.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="relative">
              <label className="block text-white/40 text-xs mb-1.5 font-medium">
                Date
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                />
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors scheme-dark"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={!departure || !destination || departure === destination}
            className="mt-4 w-full bg-primary text-black font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight size={18} />
            Rechercher les trajets disponibles
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-white/20 animate-bounce">
        <ChevronDown size={18} />
      </div>
    </section>
  );
};
