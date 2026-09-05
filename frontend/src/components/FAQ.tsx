import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "Comment réserver un billet ?",
    a: "Sélectionnez votre trajet et date sur notre formulaire de recherche, choisissez votre place et procédez au paiement. Vous recevrez une confirmation par email.",
  },
  {
    q: "Quels sont les moyens de paiement acceptés ?",
    a: "Nous acceptons le paiement mobile (MVola), ainsi que les virements bancaires. Le paiement est sécurisé et crypté.",
  },
  {
    q: "Puis-je annuler ou modifier ma réservation ?",
    a: "Oui, vous pouvez annuler ou modifier votre réservation jusqu'à 2 heures avant le départ prévu via votre espace personnel.",
  },
  {
    q: "Combien de bagages puis-je emporter ?",
    a: "Chaque passager peut emporter 1 bagage en soute (jusqu'à 15 kg) et 1 bagage à main. Les bagages supplémentaires sont soumis à un supplément.",
  },
  {
    q: "Les bus sont-ils climatisés ?",
    a: "Oui, tous nos véhicules sont climatisés et entretenus régulièrement pour garantir votre confort tout au long du trajet.",
  },
  {
    q: "Que se passe-t-il en cas de retard ?",
    a: "En cas de retard, vous êtes notifié par SMS/email. Vous pouvez échanger votre billet pour un départ ultérieur sans frais supplémentaires.",
  },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <p className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
            Questions fréquentes
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
            Besoin d'<span className="text-primary">aide</span> ?
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-gray-900 font-semibold text-sm pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${open === i ? "max-h-40" : "max-h-0"}`}
              >
                <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
