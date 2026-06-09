import {
  CheckCircle,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, logout, updateProfile, isUpdateLoading, updateError } =
    useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    try {
      await updateProfile(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      });
      setSuccessMessage("Profil mis à jour avec succès");
      setIsEditing(false);
    } catch {
      // error is in updateError
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    });
    setIsEditing(false);
    setSuccessMessage("");
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <Container className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mon Profil</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Gérez vos informations personnelles
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} />
              Modifier
            </button>
          )}
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

            {successMessage && (
              <div className="flex gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                <CheckCircle
                  size={16}
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-emerald-700">{successMessage}</p>
              </div>
            )}

            {updateError && (
              <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  {(updateError as any)?.response?.data?.message ||
                    "Erreur lors de la mise à jour"}
                </p>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Téléphone{" "}
                    <span className="text-gray-400 normal-case font-normal">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    type="tel"
                    className={inputClass}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="034 00 000 00"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdateLoading}
                    className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {isUpdateLoading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            ) : (
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
            )}
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
