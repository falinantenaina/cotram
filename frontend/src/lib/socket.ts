import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../stores/useAuthStore";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const baseURL = import.meta.env.VITE_API_URL || "/api";
    const origin = baseURL.replace(/\/api\/?$/, "");

    socket = io(origin || window.location.origin, {
      path: "/socket.io",
      autoConnect: false,
      auth: (cb) => {
        cb({ token: useAuthStore.getState().token });
      },
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: useAuthStore.getState().token };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
