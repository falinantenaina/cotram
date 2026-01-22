import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  authApi,
  type LoginCredentials,
  type RegisterData,
} from "../api/authApi";
import { useAuthStore } from "../stores/useAuthStore";

export const useAuth = () => {
  const { user, token, setAuth, clearAuth, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Query pour récupérer l'utilisateur connecté
  const { isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: authApi.getMe,
    enabled: !!token && !user,
    retry: false,
  });

  // Mutation pour la connexion
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.setQueryData(["me"], data.user);
      navigate("/");
    },
  });

  // Mutation pour l'inscription
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.setQueryData(["me"], data.user);
      navigate("/");
    },
  });

  // Mutation pour la déconnexion
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate("/auth");
    },
  });

  // Fonction pour récupérer les infos utilisateur
  const getMe = async () => {
    if (!token) return;
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      clearAuth();
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login: (credentials: LoginCredentials) =>
      loginMutation.mutateAsync(credentials),
    register: (data: RegisterData) => registerMutation.mutateAsync(data),
    logout: () => logoutMutation.mutate(),
    getMe,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};
