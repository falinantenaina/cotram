import {
  AlertCircle,
  ArrowRight,
  Bus,
  Check,
  Eye,
  EyeOff,
  Loader,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import cars from "../assets/car.webp";
import { useAuth } from "../hooks/useAuth";

const Auth = () => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get("returnTo") || "/";
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

  if (user) return <Navigate to={returnTo} replace />;

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
      navigate(returnTo);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleLogin = () => {
    const CALLBACK_URL =
      import.meta.env.MODE === "production"
        ? "https://cotram.vercel.app"
        : "http://localhost:5000";
    window.location.href = `${CALLBACK_URL}/api/auth/google`;
  };

  const error = tab === "login" ? loginError : registerError;
  const isLoading = tab === "login" ? isLoginLoading : isRegisterLoading;

  const inputClass =
    "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center">
              <Bus size={18} className="text-black" />
            </div>
            <span className="font-bold text-xl text-gray-900">Cotram Plus</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {tab === "login" ? "Bon retour !" : "Créer un compte"}
            </h1>
            <p className="text-gray-400 text-sm">
              {tab === "login"
                ? "Connectez-vous pour gérer vos voyages."
                : "Rejoignez Cotram et voyagez facilement."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                {(error as any)?.response?.data?.message ||
                  "Une erreur est survenue"}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Nom complet
                </label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                {tab === "login" ? "Email ou Téléphone" : "Email"}
              </label>
              <input
                className={inputClass}
                type={tab === "login" ? "text" : "email"}
                placeholder={
                  tab === "login"
                    ? "email@exemple.com ou 034..."
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
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Téléphone{" "}
                  <span className="text-gray-400 normal-case font-normal">
                    (optionnel)
                  </span>
                </label>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="034 00 000 00"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mot de passe
                </label>
                {tab === "login" && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Oublié ?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="••••••••"
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

            <button
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  {tab === "login" ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">
              ou continuer avec
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700 cursor-pointer"
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
            Continuer avec Google
          </button>

          <p className="text-center text-gray-400 text-xs mt-6">
            En continuant, vous acceptez nos{" "}
            <Link className="text-gray-600 hover:underline" to="/conditions">
              Conditions
            </Link>{" "}
            et notre{" "}
            <Link
              className="text-gray-600 hover:underline"
              to="/confidentiality"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Right: Visual panel with image */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background image */}
        <img
          src={cars}
          alt="Cotram véhicules"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
        {/* Side gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

        {/* Content */}
        <div className="relative">
          <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-8">
            Cotram Plus
          </p>
          <h2 className="text-3xl font-black text-white leading-tight mb-6">
            Voyagez serein entre les villes de Madagascar
          </h2>
          <ul className="space-y-3">
            {[
              "Réservation en ligne en 2 minutes",
              "Sièges garantis avant le départ",
              "Suivi de vos trajets et historique complet",
              "Flotte moderne et sécurisée",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-white/70 text-sm"
              >
                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-black font-black text-sm shrink-0">
              S
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Sarah R.</p>
              <p className="text-white/40 text-xs">Voyageuse régulière</p>
            </div>
          </div>
          <p className="text-white/70 text-sm leading-relaxed italic">
            "Service impeccable ! J'ai réservé mon billet en 2
            minutes. Le bus était à l'heure et très confortable."
          </p>
          <div className="flex gap-0.5 mt-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-primary text-sm">
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
