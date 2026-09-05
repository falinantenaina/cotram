import { Armchair, Clock4, Headphones, ShieldCheck } from "lucide-react";

const infos = [
  {
    icon: <Armchair size={24} />,
    title: "Confort Premium",
    desc: "Sièges spacieux et espace suffisant pour vos jambes sur tous nos trajets.",
    stat: "16 places",
    statLabel: "par véhicule",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Sécurité Maximale",
    desc: "Véhicules inspectés quotidiennement et chauffeurs professionnels expérimentés.",
    stat: "100%",
    statLabel: "véhicules contrôlés",
  },
  {
    icon: <Clock4 size={24} />,
    title: "Ponctualité Garantie",
    desc: "Des départs à l'heure fixe. Nous respectons votre temps et votre planning.",
    stat: "6+",
    statLabel: "départs par jour",
  },
  {
    icon: <Headphones size={24} />,
    title: "Service Client 24h/24",
    desc: "Une équipe dédiée pour répondre à vos questions et vous accompagner à tout moment.",
    stat: "24/7",
    statLabel: "support disponible",
  },
];

export const About = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
            Pourquoi nous choisir ?
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
            Une expérience de voyage{" "}
            <span className="text-primary">repensée</span> pour vous
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Nous mettons un point d'honneur à offrir un service de qualité
            supérieure, de la réservation jusqu'à votre arrivée à destination.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {infos.map((info) => (
            <div
              key={info.title}
              className="group relative bg-gray-50 hover:bg-gray-900 border border-gray-100 hover:border-gray-800 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
            >
              {/* Background pattern on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                {/* Icon */}
                <div className="inline-flex items-center justify-center size-12 bg-primary/10 group-hover:bg-primary/20 text-primary rounded-xl mb-6 transition-colors">
                  {info.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-white mb-3 transition-colors">
                  {info.title}
                </h3>

                {/* Desc */}
                <p className="text-gray-500 group-hover:text-white/60 text-sm leading-relaxed mb-6 transition-colors">
                  {info.desc}
                </p>

                {/* Stat */}
                <div className="flex items-baseline gap-1.5 pt-6 border-t border-gray-200 group-hover:border-white/10 transition-colors">
                  <span className="text-2xl font-black text-primary">
                    {info.stat}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-white/40 transition-colors">
                    {info.statLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
