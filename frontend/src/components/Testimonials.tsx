import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Andriamanantsoa M.",
    role: "Voyageur régulier",
    text: "Le meilleur service de transport entre Tana et Antsirabe. Les bus sont propres, les chauffeurs sont professionnels et les départs sont ponctuels.",
    rating: 5,
  },
  {
    name: "Rakoto Jean P.",
    role: "Entrepreneur",
    text: "Je voyage chaque semaine pour mes affaires. La réservation en ligne m'économise un temps précieux. Je recommande vivement.",
    rating: 5,
  },
  {
    name: "Rasoamanarivo H.",
    role: "Étudiante",
    text: "Enfin un moyen de transport fiable et abordable pour aller à Ambatolampy. Le paiement mobile est très pratique.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
            Témoignages
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
            Ce que disent nos{" "}
            <span className="text-primary">passagers</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-primary fill-primary"
                  />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {t.name}
                  </div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
