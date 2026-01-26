import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "../components/ui/Container";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("Mot de passe réinitialisé avec succès");
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Erreur de connexion au serveur");
    }
  };

  if (!token) {
    return (
      <Container className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="size-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Token manquant</h2>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center mb-6">
          <Lock className="size-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nouveau mot de passe</h2>
          <p className="text-gray-600">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-2">
            <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">{message}</p>
              <p className="text-sm text-green-700">Redirection...</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-2">
            <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block font-medium mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-200 rounded py-2 px-3 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={status === "success"}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-medium mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-200 rounded py-2 px-3 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={status === "success"}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-primary text-black py-3 px-4 rounded font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>
      </div>
    </Container>
  );
};

export default ResetPassword;
