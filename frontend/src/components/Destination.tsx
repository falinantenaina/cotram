import { Bus, Clock4 } from "lucide-react";
import { Button } from "./ui/Button";
import { Container } from "./ui/Container";

const destinations = [
  {
    route: "Antananarivo -> Antsirabe",
    duration: "5h 30min",
    wave: "Départs toutes les heures",
    price: 20000,
  },
  {
    route: "Antananarivo -> Ambatolampy",
    duration: "2h 30min",
    wave: "Départs fréquents",
    price: 15000,
  },
  {
    route: "Antsirabe -> Antananarivo",
    duration: "5h 30min",
    wave: "Retour simple",
    price: 20000,
  },
];

export const Destination = () => {
  return (
    <Container className="bg-dark-gray py-12">
      <div>
        <span className="text-primary uppercase font-bold">
          Nos destinations
        </span>
        <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl text-white">
          Lignes populaires
        </h2>
        <div className="mt-6">
          {destinations.map((destination) => (
            <div
              key={destination.route}
              className="border-y border-white/10 py-4 space-y-4 md:flex justify-between items-center lg:py-8"
            >
              <div>
                <div className="text-white lg:text-2xl">
                  {destination.route}
                </div>
                <div className="text-white/60 flex gap-x-1">
                  <div className="flex items-center gap-x-1">
                    <Clock4 />
                    <span>{destination.duration}</span>
                  </div>
                  <div className="flex items-center gap-x-1">
                    <Bus />
                    <span>{destination.wave}</span>
                  </div>
                </div>
              </div>
              <div className="md:flex items-center gap-x-4">
                <span className="text-primary font-bold text-xl max-md:hidden">
                  {destination.price.toLocaleString()}Ar
                </span>
                <Button>Réserver</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};
