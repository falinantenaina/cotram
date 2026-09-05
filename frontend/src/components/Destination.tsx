import { ArrowRight, Bus, ChevronLeft, ChevronRight, Clock4, MapPin } from "lucide-react";
import { useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ["public-routes"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data.routes as RouteData[];
    },
  });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

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
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[300px] bg-white/3 border border-white/[0.07] rounded-2xl p-6 animate-pulse"
              >
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="size-10 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="size-10 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate("/reservation")}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ml-2"
            >
              Voir tous
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {routes?.map((route) => (
            <div
              key={route.id}
              className="group min-w-[300px] md:min-w-[340px] snap-start bg-white/3 hover:bg-white/6 border border-white/[0.07] hover:border-white/12 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    <span className="text-white/50 text-sm">
                      {route.departure.name}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-white/30" />
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-white/30" />
                    <span className="text-white text-sm font-semibold">
                      {route.destination.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-6">
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
                    <span>Fréquent</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                <div>
                  <div className="text-white/30 text-xs">À partir de</div>
                  <div className="text-xl font-black text-primary">
                    {route.price.toLocaleString()}
                    <span className="text-xs font-semibold text-primary/60 ml-1">
                      Ar
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/reservation")}
                  className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all group-hover:shadow-lg group-hover:shadow-primary/20 active:scale-95"
                >
                  Réserver
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
