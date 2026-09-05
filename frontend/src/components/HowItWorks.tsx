import { Calendar, CreditCard, MapPin } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: <MapPin size={24} />,
    title: "Choisissez votre trajet",
    desc: "Sélectionnez votre ville de départ et destination parmi nos lignes disponibles.",
  },
  {
    num: "02",
    icon: <Calendar size={24} />,
    title: "Réservez en ligne",
    desc: "Choisissez votre date, votre horaire et payez votre billet en toute sécurité.",
  },
  {
    num: "03",
    icon: <CreditCard size={24} />,
    title: "Voyagez serein",
    desc: "Présentez-vous au point de départ. Votre siège vous attend.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
            Simple et rapide
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
            Comment ça <span className="text-primary">fonctionne</span> ?
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Réservez votre billet en 3 étapes, en quelques secondes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-linear-to-r from-primary/20 via-primary/40 to-primary/20" />

          {steps.map((step) => (
            <div key={step.num} className="relative text-center">
              {/* Step number */}
              <div className="relative inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6 text-primary">
                {step.icon}
                <span className="absolute -top-2 -right-2 size-6 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {step.num}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
