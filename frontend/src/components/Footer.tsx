import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "./ui/Container";

export const Footer = () => {
  return (
    <Container className="bg-black/90 text-white py-6">
      <div className="text-white/60">
        <div className="space-y-2">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 font-medium lg:text-2xl"
          >
            <span className="text-white">Cotram</span>
            <span className="bg-primary text-black px-2 rounded font-bold">
              Plus
            </span>
          </Link>
          <div className="max-w-sm">
            <p>
              Votre partenaire de confiance pour tous vos déplacement vers le
              sud.
            </p>
            <p>Une coopérative moderne au service des voyageurs</p>
          </div>
          <div className="flex gap-x-2">
            <Link
              className="bg-white/10 p-2 rounded-full text-white hover:scale-110 transition duration-300 size-10 flex items-center justify-center "
              to="https://www.facebook.com/p/Cotram-Plus-100091759827149/"
              target="_blank"
            >
              <Facebook strokeWidth={1} className="size-5" />
            </Link>
            <Link
              className="bg-white/10 p-2 rounded-full text-white hover:scale-110 transition duration-300 size-10 flex items-center justify-center"
              to="https://www.facebook.com/p/Cotram-Plus-100091759827149/"
              target="_blank"
            >
              <Instagram strokeWidth={1} className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
};
