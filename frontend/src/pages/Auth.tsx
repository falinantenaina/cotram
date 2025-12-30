import { ArrowRight, Check, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import cars from "../assets/car.webp";
import { Container } from "../components/ui/Container";

const Auth = () => {
  const user = null;
  const [tab, setTab] = useState<"login" | "register">("login");

  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword");

    console.log(identifier, password, confirmPassword);
    e.currentTarget.reset();
  };

  useEffect(() => {
    if (user) navigate("/");
  }, []);
  return (
    <div className="bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4">
        <Container>
          <div className="space-y-4 max-w-xs md:max-w-md mx-auto py-4 md:py-8">
            <div>
              <h2 className="text-xl font-semibold">Bienvenue</h2>
              <p className="text-gray-400">
                Gérez vos voyages et réservation en toute simplicité.
              </p>
            </div>
            {/* Tab button */}
            <div className="w-full flex items-center justify-center gap-x-2 bg-gray-200 text-gray-400 p-1 rounded">
              <button
                onClick={() => setTab("login")}
                className={`w-full py-1 rounded cursor-pointer ${
                  tab === "login" && "bg-white font-medium text-black"
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => setTab("register")}
                className={`w-full py-1 rounded cursor-pointer ${
                  tab === "register" && "bg-white font-medium text-black"
                }`}
              >
                Créer un compte
              </button>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col gap-y-1">
                <label className="font-medium" htmlFor="identifier">
                  Email ou Téléphone
                </label>
                <input
                  className="bg-gray-200 rounded py-1 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                  type="text"
                  name="identifier"
                  id="identifier"
                  placeholder="ex 034 00 000 00"
                  required
                />
              </div>
              <div className="flex flex-col gap-y-1">
                <label className="font-medium" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  className="bg-gray-200 rounded py-1 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="********"
                  required
                />
              </div>
              {tab === "register" && (
                <div className="flex flex-col gap-y-1">
                  <label className="font-medium" htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <input
                    className="bg-gray-200 rounded py-1 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    placeholder="********"
                    required
                  />
                </div>
              )}
              <button className="bg-primary py-2 px-4 rounded w-full font-medium cursor-pointer mt-4 flex items-center justify-center gap-x-2">
                <span>
                  {tab === "login" ? "Se connecter" : "Créer un compte"}
                </span>
                <ArrowRight strokeWidth={1} className="size-5" />
              </button>
            </form>
            <div className="space-y-1">
              <p className="uppercase text-gray-400 text-center">
                Ou continuer avec
              </p>
              <button className="w-full flex items-center justify-center gap-x-1 border border-gray-200 rounded px-4 py-1 cursor-pointer">
                <Mail className="" />
                <span>Google</span>
              </button>
            </div>
            <p className="text-center text-gray-400 text-sm">
              En continuant, vous acceptez nos{" "}
              <Link className="text-black hover:underline" to="/conditions">
                Conditions
              </Link>{" "}
              et notre{" "}
              <Link
                className="text-black hover:underline"
                to="/confidentiality"
              >
                Politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </Container>
        <div className="relative">
          {/* Background image */}
          <img
            src={cars}
            alt="car image background"
            className="absolute inset-0 size-full object-cover z-10"
          />
          <div className="absolute inset-0 size-full bg-black/80 z-10 "></div>
          <div className="z-50 relative text-white px-8 xl:px-16 py-12 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Voyagez en confort et sécurité vers antsirabe et Ambatolampy.
              </h2>
              <div>
                <ul className="flex flex-col space-y-4">
                  <li className="flex items-center gap-x-2">
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Check className="size-4" />
                    </div>
                    <p className="text-white/80">
                      Réservation en ligne instantanée
                    </p>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Check className="size-4" />
                    </div>
                    <p className="text-white/80">Flotte moderne</p>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Check className="size-4" />
                    </div>
                    <p className="text-white/80">
                      Suivi de vos trajets et historique
                    </p>
                  </li>
                </ul>
              </div>
            </div>
            {/* Testimony */}
            <div className="bg-black/40 py-2 px-4 rounded backdrop-blur-md space-y-2 ">
              <blockquote className="font-light italic">
                "Service impeccable! J'ai réservé mon billet pour Antsirabe en 2
                minutes. Le bus était à l'haure et très confortable."
              </blockquote>
              <div className="flex items-center gap-x-2">
                <div className="flex items-center justify-center bg-primary rounded-full text-black p-2 font-bold w-10">
                  S
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Sarah R.</span>
                  <span className="text-xs text-gray-500">
                    Voyageuse régulière
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
