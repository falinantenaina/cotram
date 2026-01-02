import { Button } from "./ui/Button";
import { Container } from "./ui/Container";

export const Ready = () => {
  return (
    <Container className="bg-gray-200/60 py-12 sm:py-24 xl:py-32">
      <div className="flex flex-col items-center justify-center md:gap-y-6 xl:gap-y-12">
        <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
          Prêt à partir?
        </h2>
        <p className="text-black/60 text-center max-w-md">
          Réservez votre billez en ligne des maintenant et évitez les files
          d'attente. Simple, rapide et sécurise
        </p>
        <div className="flex max-md:flex-col gap-y-2 gap-x-4">
          <Button>Commencer la réservation</Button>
          <Button variant="light">Nous contacter</Button>
        </div>
      </div>
    </Container>
  );
};
