import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: String(req.params["id"]) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
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
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name, email, phone } = req.body;

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

    const user = await prisma.user.update({
      where: { id: String(req.params["id"]) },
      data: { name, email, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, user });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.user.delete({
      where: { id: String(req.params["id"]) },
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
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
