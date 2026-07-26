import { Bus, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="flex items-center justify-center bg-primary rounded-lg size-9">
                <Bus size={18} className="text-black" />
              </div>
              <span className="font-bold text-white text-lg">Cotram Plus</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              Votre partenaire de confiance pour tous vos déplacements entre
              Antananarivo, Ambatolampy et Antsirabe.
            </p>
            <div className="flex gap-2">
              {[
                {
                  icon: <Facebook size={16} />,
                  href: "https://www.facebook.com/p/Cotram-Plus-100091759827149/",
                },
                {
                  icon: <Instagram size={16} />,
                  href: "https://www.facebook.com/p/Cotram-Plus-100091759827149/",
                },
              ].map((s, i) => (
                <Link
                  key={i}
                  to={s.href}
                  target="_blank"
                  className="size-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Accueil", to: "/" },
                { label: "Réserver un billet", to: "/reservation" },
                { label: "Mes réservations", to: "/my-reservations" },
                { label: "Contact", to: "/contact" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-white/40 hover:text-white/80 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/40">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary/60" />
                <span>Behoririka, Antananarivo 101, Madagascar</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/40">
                <Phone size={15} className="shrink-0 text-primary/60" />
                <span>+261 34 00 000 00</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/40">
                <Mail size={15} className="shrink-0 text-primary/60" />
                <span>contact@cotramplus.mg</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Cotram Plus — Coopérative de Transport
          </p>
          <p className="text-white/20 text-xs">
            Transport interurbain — Madagascar
          </p>
        </div>
      </div>
    </footer>
  );
};
