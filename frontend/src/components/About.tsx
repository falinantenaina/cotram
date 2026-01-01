import { Armchair, Clock4, ShieldCheck } from "lucide-react";
import { AboutCard } from "./AboutCard";
import { Container } from "./ui/Container";

const infos = [
  {
    icon: <Armchair />,
    title: "Confort Premium",
    desc: "Sièges spacieux et espace suffisant pour vos jambes sur tous nos trajets.",
  },
  {
    icon: <ShieldCheck />,
    title: "Sécurité maximale",
    desc: "Véhicules inspectés quotidiennement et chauffeurs professionnels expérimentés pour votre tranquillité.",
  },
  {
    icon: <Clock4 />,
    title: "Ponctualité Garantie",
    desc: "Des départs à l'heure fixe. Nous respectons votre temps et votre planning de voyage.",
  },
];

export const About = () => {
  return (
    <Container className="py-12 sm:py-24">
      <div className="max-w-md">
        <span className="text-primary uppercase font-bold">
          Pourquoi nous choisir?
        </span>
        <h2 className="font-semibold text-2xl md:text-3xl lg:text-4xl">
          Une éxpérience de voyage repensée pour vous
        </h2>
        <p className=" text-black/60 lg:mt-4">
          Nous mettons un point d'honneur à offir un service de qualité
          supérieure, de la réservation jusqu'à votre arrivée.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-10 mt-8">
        {infos.map((info) => (
          <AboutCard
            key={info.title}
            icon={info.icon}
            title={info.title}
            desc={info.desc}
          />
        ))}
      </div>
    </Container>
  );
};
