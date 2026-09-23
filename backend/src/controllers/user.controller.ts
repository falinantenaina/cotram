import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatar: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensureDriverProfile(user: {
  id: string;
  name: string;
  phone: string | null;
}) {
  const existing = await prisma.driver.findUnique({
    where: { userId: user.id },
  });
  if (existing) return;

  const parts = user.name.trim().split(/\s+/);
  const firstName = parts[0] || user.name;
  const lastName = parts.slice(1).join(" ") || "-";
  const phone = user.phone || "000 000 000";
  const licenseNumber = `MDG-TEMP-${user.id.slice(-8).toUpperCase()}`;

  const licenseTaken = await prisma.driver.findUnique({
    where: { licenseNumber },
  });

  await prisma.driver.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      phone,
      licenseNumber: licenseTaken
        ? `MDG-TEMP-${Date.now().toString(36).toUpperCase()}`
        : licenseNumber,
      vehicleNumber: "",
      status: "available",
    },
  });
}

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({
        success: false,
        message: "Nom, email et mot de passe sont requis",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Mot de passe : minimum 6 caractères",
      });
      return;
    }

    const allowedRoles = ["user", "admin", "driver", "agent", "caissier"];
    const userRole = allowedRoles.includes(role ?? "")
      ? (role as string)
      : "user";

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          ...(phone?.trim() ? [{ phone: phone.trim() }] : []),
        ],
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: "Email ou téléphone déjà utilisé",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: userRole as never,
        isEmailVerified: true,
      },
      select: USER_SELECT,
    });

    if (userRole === "driver") {
      await ensureDriverProfile(user);
    }

    res.status(201).json({ success: true, user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(400).json({
        success: false,
        message: "Email ou téléphone déjà utilisé",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: String(req.params["id"]) },
      select: USER_SELECT,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    if (
      authReq.user.role !== "admin" &&
      authReq.user.id !== String(req.params["id"])
    ) {
      res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name, email, phone, role, password } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      password?: string;
    };

    const isAdmin = authReq.user.role === "admin";
    const isSelf = authReq.user.id === String(req.params["id"]);

    if (!isAdmin && !isSelf) {
      res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone || null;

    if (role !== undefined) {
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          message: "Seul un admin peut changer un rôle",
        });
        return;
      }
      const allowedRoles = ["user", "admin", "driver", "agent", "caissier"];
      if (!allowedRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: "Rôle invalide",
        });
        return;
      }

      // Don't allow demoting the last admin
      if (authReq.user.role === "admin" && role !== "admin") {
        const target = await prisma.user.findUnique({
          where: { id: String(req.params["id"]) },
          select: { role: true },
        });
        if (target?.role === "admin") {
          const adminCount = await prisma.user.count({
            where: { role: "admin" },
          });
          if (adminCount <= 1) {
            res.status(400).json({
              success: false,
              message: "Impossible de retirer le dernier admin",
            });
            return;
          }
        }
      }

      data.role = role;
    }

    if (password !== undefined && isAdmin) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Mot de passe : minimum 6 caractères",
        });
        return;
      }
      data.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({
        success: false,
        message: "Aucune donnée à mettre à jour",
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: String(req.params["id"]) },
      data,
      select: USER_SELECT,
    });

    if (role === "driver") {
      await ensureDriverProfile(user);
    } else if (role !== undefined && role !== "driver") {
      // Unlink driver profile if role changed away from driver
      await prisma.driver.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }
    if (error.code === "P2002") {
      res.status(400).json({
        success: false,
        message: "Email ou téléphone déjà utilisé",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = String(req.params["id"]);

    // Unlink driver profile before deleting user (keep schedules history)
    await prisma.driver.updateMany({
      where: { userId },
      data: { userId: null },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
