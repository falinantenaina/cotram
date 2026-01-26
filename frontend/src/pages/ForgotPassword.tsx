import { AlertCircle, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Container } from "../components/ui/Container";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Erreur de connexion au serveur");
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
        <Link
          to="/auth"
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="size-5" />
          <span>Retour</span>
        </Link>

        <div className="text-center mb-6">
          <Mail className="size-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Mot de passe oublié ?</h2>
          <p className="text-gray-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser
            votre mot de passe
          </p>
        </div>

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-2">
            <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 font-medium">
                Email envoyé !
              </p>
              <p className="text-sm text-green-700">{message}</p>
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
            <label htmlFor="email" className="block font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-200 rounded py-2 px-3 focus:outline-1 focus:outline-primary/50 focus:ring-1 focus:ring-primary/50"
              placeholder="email@exemple.com"
              required
              disabled={status === "success"}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="w-full bg-primary text-black py-3 px-4 rounded font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </Container>
  );
};

export default ForgotPassword;
