import { ArrowRight, Bus, Clock4, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const destinations = [
  {
    route: "Antananarivo → Antsirabe",
    from: "Antananarivo",
    to: "Antsirabe",
    duration: "5h 30min",
    distance: "170 km",
    wave: "Départs toutes les 2h",
    price: 20000,
    times: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"],
  },
  {
    route: "Antananarivo → Ambatolampy",
    from: "Antananarivo",
    to: "Ambatolampy",
    duration: "2h 30min",
    distance: "68 km",
    wave: "Départs fréquents",
    price: 15000,
    times: ["07:00", "09:00", "11:00", "13:00"],
  },
  {
    route: "Antsirabe → Antananarivo",
    from: "Antsirabe",
    to: "Antananarivo",
    duration: "5h 30min",
    distance: "170 km",
    wave: "Retour quotidien",
    price: 20000,
    times: ["05:00", "07:00", "09:00", "11:00"],
  },
];

export const Destination = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-950 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
              Nos destinations
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Lignes populaires
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

        {/* Routes */}
        <div className="space-y-4">
          {destinations.map((dest) => (
            <div
              key={dest.route}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.12] rounded-2xl p-6 md:p-8 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Route info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-primary" />
                      <span className="text-white/50 text-sm">{dest.from}</span>
                    </div>
                    <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-white/20 to-white/5" />
                    <ArrowRight size={14} className="text-white/30" />
                    <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-white/20 to-white/5" />
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-white/30" />
                      <span className="text-white text-sm font-semibold">
                        {dest.to}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Clock4 size={13} />
                      <span>{dest.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>{dest.distance}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bus size={13} />
                      <span>{dest.wave}</span>
                    </div>
                  </div>

                  {/* Time chips */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {dest.times.map((t) => (
                      <span
                        key={t}
                        className="bg-white/5 border border-white/10 text-white/50 text-xs px-2.5 py-1 rounded-lg font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  <div className="md:text-right">
                    <div className="text-white/30 text-xs mb-0.5">
                      À partir de
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-primary">
                      {dest.price.toLocaleString()}
                      <span className="text-base font-semibold text-primary/60 ml-1">
                        Ar
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/reservation")}
                    className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-3 rounded-xl text-sm hover:bg-primary/90 transition-all group-hover:shadow-lg group-hover:shadow-primary/20 active:scale-95 whitespace-nowrap"
                  >
                    Réserver
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
