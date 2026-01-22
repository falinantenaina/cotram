import { CheckCircle, Mail, Phone, Shield, XCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="size-20 rounded-full"
              />
            ) : (
              <div className="size-20 rounded-full bg-primary flex items-center justify-center text-black text-2xl font-bold">
                {user.name[0]}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-600">
                {user.role === "admin" ? "Administrateur" : "Utilisateur"}
              </p>
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {user.isEmailVerified ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="size-5" />
                  <span className="text-sm">Vérifié</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <XCircle className="size-5" />
                  <span className="text-sm">Non vérifié</span>
                </div>
              )}
            </div>

            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Shield className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Rôle</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => logout()}
            className="w-full bg-red-500 text-white py-3 px-4 rounded font-semibold hover:bg-red-600"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </Container>
  );
};

export default Profile;
