import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import cars from "../assets/car.webp";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";

const Auth = () => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const {
    user,
    login,
    register,
    isLoginLoading,
    isRegisterLoading,
    loginError,
    registerError,
  } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (tab === "login") {
        await login({
          identifier: formData.email,
          password: formData.password,
        });
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert("Les mots de passe ne correspondent pas");
          return;
        }
        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const error = tab === "login" ? loginError : registerError;
  const isLoading = tab === "login" ? isLoginLoading : isRegisterLoading;

  return (
    <div className="bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4">
        <Container>
          <div className="space-y-4 max-w-xs md:max-w-md mx-auto py-4 md:py-8">
            <div>
              <h2 className="text-xl md:text-3xl font-semibold">Bienvenue</h2>
              <p className="text-gray-400">
                Gérez vos voyages et réservations en toute simplicité.
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {error?.response?.data?.message || "Une erreur est survenue"}
                </p>
              </div>
            )}

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
              {tab === "register" && (
                <div className="flex flex-col gap-y-1">
                  <label className="font-medium" htmlFor="name">
                    Nom complet
                  </label>
                  <input
                    className="bg-gray-200 rounded py-2 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-y-1">
                <label className="font-medium" htmlFor="email">
                  Email {tab === "login" && "ou Téléphone"}
                </label>
                <input
                  className="bg-gray-200 rounded py-2 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                  type={tab === "login" ? "text" : "email"}
                  name="email"
                  id="email"
                  placeholder={
                    tab === "login"
                      ? "email@exemple.com ou 034 00 000 00"
                      : "email@exemple.com"
                  }
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              {tab === "register" && (
                <div className="flex flex-col gap-y-1">
                  <label className="font-medium" htmlFor="phone">
                    Téléphone
                  </label>
                  <input
                    className="bg-gray-200 rounded py-2 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder="034 00 000 00"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="flex flex-col gap-y-1">
                <label className="font-medium" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  className="bg-gray-200 rounded py-2 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              {tab === "register" && (
                <div className="flex flex-col gap-y-1">
                  <label className="font-medium" htmlFor="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <input
                    className="bg-gray-200 rounded py-2 px-2 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              {tab === "login" && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              )}

              <button
                disabled={isLoading}
                className="bg-primary py-2 px-4 rounded w-full font-medium cursor-pointer mt-4 flex items-center justify-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {isLoading
                    ? "Chargement..."
                    : tab === "login"
                      ? "Se connecter"
                      : "Créer un compte"}
                </span>
                {!isLoading && (
                  <ArrowRight strokeWidth={1} className="size-5" />
                )}
              </button>
            </form>

            <div className="space-y-1">
              <p className="uppercase text-gray-400 text-center">
                Ou continuer avec
              </p>
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-x-2 border border-gray-200 rounded px-4 py-2 cursor-pointer hover:bg-gray-50"
              >
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
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
          <img
            src={cars}
            alt="car image background"
            className="absolute inset-0 size-full object-cover z-10"
          />
          <div className="absolute inset-0 size-full bg-black/80 z-10 "></div>
          <div className="z-50 relative text-white px-8 xl:px-16 py-12 flex flex-col justify-between h-full">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Voyagez en confort et sécurité vers Antsirabe et Ambatolampy.
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

            <div className="bg-black/40 py-2 px-4 rounded backdrop-blur-md space-y-2 ">
              <blockquote className="font-light italic">
                "Service impeccable! J'ai réservé mon billet pour Antsirabe en 2
                minutes. Le bus était à l'heure et très confortable."
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
