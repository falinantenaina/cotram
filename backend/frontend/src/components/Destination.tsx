import { ArrowRight, Bus, Clock4, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

interface RouteData {
  id: string;
  departure: { id: string; name: string };
  destination: { id: string; name: string };
  duration: string;
  distance: number;
  price: number;
}

export const Destination = () => {
  const navigate = useNavigate();

  const { data: routes, isLoading } = useQuery({
    queryKey: ["public-routes"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes as RouteData[];
    },
  });

  if (isLoading) {
    return (
      <section className="bg-gray-950 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
                Nos destinations
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                Lignes populaires
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/3 border border-white/[0.07] rounded-2xl p-6 md:p-8 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
          {routes?.map((route) => (
            <div
              key={route.id}
              className="group bg-white/3 hover:bg-white/6 border border-white/[0.07] hover:border-white/12 rounded-2xl p-6 md:p-8 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Route info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-primary" />
                      <span className="text-white/50 text-sm">{route.departure.name}</span>
                    </div>
                    <div className="h-px flex-1 max-w-16 bg-linear-to-r from-white/20 to-white/5" />
                    <ArrowRight size={14} className="text-white/30" />
                    <div className="h-px flex-1 max-w-16 bg-linear-to-l from-white/20 to-white/5" />
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-white/30" />
                      <span className="text-white text-sm font-semibold">
                        {route.destination.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/40">
                    <div className="flex items-center gap-1.5">
                      <Clock4 size={13} />
                      <span>{route.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>{route.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bus size={13} />
                      <span>Départs fréquents</span>
                    </div>
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  <div className="md:text-right">
                    <div className="text-white/30 text-xs mb-0.5">
                      À partir de
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-primary">
                      {route.price.toLocaleString()}
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
