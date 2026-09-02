import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        departure: true,
        destination: true,
      },
    });
    res.json({ success: true, routes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: String(req.params.id) },
      include: {
        departure: true,
        destination: true,
      },
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
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const createRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departureId, destinationId, duration, distance, price } = req.body;

    if (!departureId || !destinationId) {
      res.status(400).json({
        success: false,
        message: "Les villes de départ et de destination sont requises",
      });
      return;
    }

    if (departureId === destinationId) {
      res.status(400).json({
        success: false,
        message: "La ville de départ et de destination doivent être différentes",
      });
      return;
    }

    const departureCity = await prisma.city.findUnique({
      where: { id: departureId },
    });

    const destinationCity = await prisma.city.findUnique({
      where: { id: destinationId },
    });

    if (!departureCity || !destinationCity) {
      res.status(400).json({
        success: false,
        message: "Une ou les deux villes spécifiées n'existent pas",
      });
      return;
    }

    const route = await prisma.route.create({
      data: {
        departureId,
        destinationId,
        duration,
        distance,
        price,
      },
      include: {
        departure: true,
        destination: true,
      },
    });

    res.status(201).json({ success: true, route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departureId, destinationId } = req.body;

    if (departureId && destinationId && departureId === destinationId) {
      res.status(400).json({
        success: false,
        message: "La ville de départ et de destination doivent être différentes",
      });
      return;
    }

    if (departureId) {
      const departureCity = await prisma.city.findUnique({
        where: { id: departureId },
      });
      if (!departureCity) {
        res.status(400).json({
          success: false,
          message: "La ville de départ spécifiée n'existe pas",
        });
        return;
      }
    }

    if (destinationId) {
      const destinationCity = await prisma.city.findUnique({
        where: { id: destinationId },
      });
      if (!destinationCity) {
        res.status(400).json({
          success: false,
          message: "La ville de destination spécifiée n'existe pas",
        });
        return;
      }
    }

    const route = await prisma.route.update({
      where: { id: String(req.params.id) },
      data: req.body,
      include: {
        departure: true,
        destination: true,
      },
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
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
