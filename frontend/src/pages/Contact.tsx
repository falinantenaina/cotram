import {
  Clock4,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";

const Contact = () => {
  return (
    <Container className="py-6">
      <div>
        <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl text-center">
          Parlons de votre voyage
        </h2>
        <p className="max-w-lg mx-auto text-center text-black/60">
          Notre équipe est disponible 7j/7 pour répondre à vos questions sur
          nos trajets interurbains à Madagascar.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Info */}
        <div className="md:col-span-3 bg-gray-200 rounded p-4 space-y-2 w-max max-w-full mx-auto">
          <div className="flex  gap-x-2">
            <div className="bg-white size-10 p-1 rounded flex items-center justify-center">
              <MapPin strokeWidth={1} className="size-7" />
            </div>
            <div>
              <h3 className="font-medium">Siège Social</h3>
              <p className="max-w-sm text-black/60">
                Behoririka, Antananarivo 101, Madagascar
              </p>
            </div>
          </div>
          <div className="flex gap-x-2">
            <div className="bg-white size-10 p-1 rounded flex items-center justify-center">
              <Phone strokeWidth={1} className="size-7" />
            </div>
            <div>
              <h3 className="font-medium">Téléphone</h3>
              <div>
                <p className="max-w-sm text-black/60">+261 34 00 000 00</p>
                <p className="max-w-sm text-black/60">+261 34 00 000 00</p>
              </div>
            </div>
          </div>
          <div className="flex  gap-x-2">
            <div className="bg-white size-10 p-1 rounded flex items-center justify-center">
              <Mail strokeWidth={1} className="size-7" />
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="max-w-sm text-black/60">contact@cotramplus.mg</p>
            </div>
          </div>
          <div className="flex  gap-x-2">
            <div className="bg-white size-10 p-1 rounded flex items-center justify-center">
              <Clock4 strokeWidth={1} className="size-7" />
            </div>
            <div>
              <h3 className="font-medium">Heures d'ouverture</h3>
              <div>
                <p className="max-w-sm text-black/60">Lundi - Dimanche</p>
                <p className="max-w-sm text-black/60">05:00 - 18:00</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-lg">Suivez-nous</h3>
            <div className="flex space-x-2 mt-2">
              <Link
                to=""
                className="block bg-black w-max p-2 rounded-full text-white hover:scale-110 transition duration-200"
              >
                <Facebook className="size-4" />
              </Link>
              <Link
                to=""
                className="block bg-black w-max p-2 rounded-full text-white hover:scale-110 transition duration-200"
              >
                <Instagram className="size-4" />
              </Link>
              <Link
                to=""
                className="block bg-black w-max p-2 rounded-full text-white hover:scale-110 transition duration-200"
              >
                <Twitter className="size-4" />
              </Link>
            </div>
          </div>
        </div>
        {/* Contact form */}
        <div className="grid-cols-8 col-start-5">
          <form action="">
            <div>
              <div>
                <label htmlFor="name">Nom</label>
              </div>
              <div></div>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default Contact;
