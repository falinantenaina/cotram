import { ArrowRight, Calendar, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import mvolaLogo from "../assets/mvola.svg";
import orangeLogo from "../assets/orangemoney.svg";

export const Ready = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative bg-gray-950 rounded-3xl px-8 md:px-16 py-16 md:py-20 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative text-center">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">
              Commencez maintenant
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Prêt pour votre prochain voyage ?
            </h2>
            <p className="text-white/50 text-lg max-w-md mx-auto mb-8 leading-relaxed">
              Réservez votre billet en ligne et évitez les files d'attente.
              Simple, rapide et sécurisé.
            </p>

            {/* Payment logos */}
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                <img src={mvolaLogo} alt="MVola" className="h-6 w-auto" />
                <span className="text-white/60 text-sm font-medium">MVola</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                <img src={orangeLogo} alt="Orange Money" className="h-6 w-auto" />
                <span className="text-white/60 text-sm font-medium">Orange Money</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                <span className="text-lg">💵</span>
                <span className="text-white/60 text-sm font-medium">Espèces</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/reservation")}
                className="group flex items-center justify-center gap-2 bg-primary text-black font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-95"
              >
                <Calendar size={18} />
                Réserver un billet
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80 font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all"
              >
                <Phone size={18} />
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
