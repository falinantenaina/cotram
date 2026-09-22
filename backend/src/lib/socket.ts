import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import prisma from "./prisma.js";

let io: Server | null = null;

interface SocketPayload {
  id: string;
}

const STAFF_ROLES = new Set(["admin", "caissier", "agent"]);

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: process.env.FRONTEND_URL || "https://api.nragency.tech",
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : undefined);

      if (!token) {
        next(new Error("Token manquant"));
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketPayload;
      (socket.data as { userId: string }).userId = decoded.id;
      next();
    } catch {
      next(new Error("Token invalide"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket.data as { userId: string }).userId;
    if (!userId) return;

    socket.join(`user:${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user && STAFF_ROLES.has(user.role)) {
        socket.join("staff");
      }
    } catch {
      // connection stays on personal room only
    }
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToStaff(event: string, payload: unknown): void {
  io?.to("staff").emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
