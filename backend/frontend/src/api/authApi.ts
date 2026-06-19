import api from "../lib/axios";
import type { User } from "../stores/useAuthStore";

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", credentials);
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/register", userData);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data.user;
  },

  updateProfile: async (userId: string, userData: UpdateProfileData): Promise<User> => {
    const { data } = await api.put(`/users/${userId}`, userData);
    return data.user;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
