import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      navigate("/auth?error=google");
      return;
    }

    // Appeler /api/auth/me pour récupérer les infos user avec ce token
    fetch("http://localhost:5000/api/auth/me", {
      // ou votre endpoint getMe
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAuth(data.user, token);
          navigate("/");
        } else {
          navigate("/auth?error=google");
        }
      })
      .catch(() => navigate("/auth?error=google"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Connexion en cours...</p>
    </div>
  );
};

export default GoogleAuthCallback;
