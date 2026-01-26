import { CheckCircle, Loader, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "../components/ui/Container";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token manquant");
      return;
    }

    fetch(`http://localhost:5000/api/auth/verify-email/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Erreur de vérification");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erreur de connexion au serveur");
      });
  }, [searchParams]);

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader className="size-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              Vérification en cours...
            </h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Email vérifié !</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/auth"
              className="bg-primary text-black px-6 py-3 rounded font-semibold hover:bg-primary/90 inline-block"
            >
              Se connecter
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="size-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erreur de vérification</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/auth" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </Container>
  );
};

export default VerifyEmail;
