import {
  CheckCircle,
  LogOut,
  Mail,
  Phone,
  Shield,
  XCircle,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <Container className="py-6">
          <h1 className="text-2xl font-black text-gray-900">Mon Profil</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gérez vos informations personnelles
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Avatar + info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-50">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-16 rounded-2xl ring-2 ring-primary/20"
                />
              ) : (
                <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center text-black text-2xl font-black">
                  {user.name[0]}
                </div>
              )}
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {user.name}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {user.role === "admin" ? "Administrateur" : "Voyageur"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={15} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {user.email}
                  </p>
                </div>
                {user.isEmailVerified ? (
                  <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                    <CheckCircle size={16} />
                    <span className="text-xs font-semibold">Vérifié</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-500 shrink-0">
                    <XCircle size={16} />
                    <span className="text-xs font-semibold">Non vérifié</span>
                  </div>
                )}
              </div>

              {user.phone && (
                <div className="flex items-center gap-4">
                  <div className="size-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="size-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={15} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Rôle</p>
                  <p className="font-semibold text-gray-900 text-sm capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-semibold py-3.5 px-4 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </Container>
    </div>
  );
};

export default Profile;
