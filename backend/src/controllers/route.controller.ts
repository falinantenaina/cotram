import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
    });
    res.json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!route) {
      res.status(404).json({
        success: false,
        message: "Trajet non trouvé",
      });
      return;
    }

    res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departure, destination, duration, distance, price } = req.body;

    const route = await prisma.route.create({
      data: {
        departure,
        destination,
        duration,
        distance,
        price,
      },
    });

    res.status(201).json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const route = await prisma.route.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });

    res.json({ success: true, route });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Trajet non trouvé",
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.route.delete({
      where: { id: String(req.params.id) },
    });

    res.json({ success: true, message: "Trajet supprimé" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Trajet non trouvé",
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
