import { Calendar, Check } from "lucide-react";
import hero from "../assets/hero.webp";
import { TravelFinder } from "./TravelFinder";
import { Button } from "./ui/Button";
import { Container } from "./ui/Container";

export const Hero = () => {
  return (
    <div className="bg-dark-gray text-white/80 relative sm:pb-16 py-12 md:py-16 lg:py-20 xl:py-24">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 space-x-4 lg:space-x-12">
          <div className="space-y-4 md:space-y-8">
            <div className="text-primary bg-primary/10 rounded-full py-1 px-3 text-sm w-max">
              Le confort à chaque kilomètre
            </div>
            <h1 className="text-white font-bold text-2xl lg:text-4xl">
              Voyagez entre <span className="text-primary">Tana</span>,{" "}
              <span className="text-primary">Ambatolampy</span> et{" "}
              <span className="text-primary">Antsirabe</span>
            </h1>
            <div>
              <p className="text-white/60">
                CO Plus vous offre une expérience de voyage premium.
              </p>
              <p className="text-white/60">
                Sécurité, pontualité et confort dans nos véhicules modernes noir
                et gris
              </p>
            </div>
            {/* Button */}
            <div className="flex max-[1128px]:flex-col gap-4">
              <Button>
                <Calendar />
                <span>Réserver maintenant</span>
              </Button>
              <Button variant="secondary">Voir les tarifs</Button>
            </div>
            <ul className="flex space-x-4">
              <li className="flex items-center space-x-2">
                <div className="border border-primary rounded-full flex items-center justify-center p-1 size-4 text-primary">
                  <Check className="size-4" />
                </div>
                <span className="text-white/60">Wi-Fi gratuit</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="border border-primary rounded-full flex items-center justify-center p-1 size-4 text-primary">
                  <Check className="size-4" />
                </div>
                <span className="text-white/60">Départs quotidiens</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="border border-primary rounded-full flex items-center justify-center p-1 size-4 text-primary">
                  <Check className="size-4" />
                </div>
                <span className="text-white/60">Sièges spacieux</span>
              </li>
            </ul>
          </div>
          <div className="max-md:hidden flex items-center justify-center">
            <div className="relative">
              <img
                src={hero}
                alt="Hero image"
                className="inset-0 z-50 w-150 h-100 rounded object-cover"
              />
              <div className="w-full absolute inset-0 bg-black/50"></div>
            </div>
          </div>
        </div>
      </Container>
      <TravelFinder />
    </div>
  );
};
