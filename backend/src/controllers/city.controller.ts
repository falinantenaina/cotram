import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getAllCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = await prisma.city.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!city) {
      res.status(404).json({
        success: false,
        message: "Ville non trouvée",
      });
      return;
    }

    res.json({ success: true, city });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createCity = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, region } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Le nom de la ville est requis",
      });
      return;
    }

    const existingCity = await prisma.city.findUnique({
      where: { name: name.trim() },
    });

    if (existingCity) {
      res.status(400).json({
        success: false,
        message: "Cette ville existe déjà",
      });
      return;
    }

    const city = await prisma.city.create({
      data: {
        name: name.trim(),
        region: region?.trim() || null,
      },
    });

    res.status(201).json({ success: true, city });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCity = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, region, isActive } = req.body;
    const cityId = String(req.params.id);

    if (name !== undefined) {
      const existingCity = await prisma.city.findFirst({
        where: {
          name: name.trim(),
          id: { not: cityId },
        },
      });

      if (existingCity) {
        res.status(400).json({
          success: false,
          message: "Cette ville existe déjà",
        });
        return;
      }
    }

    const city = await prisma.city.update({
      where: { id: cityId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(region !== undefined && { region: region?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, city });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Ville non trouvée",
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCity = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cityId = String(req.params.id);

    const routesUsingCity = await prisma.route.findFirst({
      where: {
        OR: [
          { departureId: cityId },
          { destinationId: cityId },
        ],
      },
    });

    if (routesUsingCity) {
      res.status(400).json({
        success: false,
        message: "Impossible de supprimer cette ville car elle est utilisée dans des routes",
      });
      return;
    }

    await prisma.city.delete({
      where: { id: cityId },
    });

    res.json({ success: true, message: "Ville supprimée" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Ville non trouvée",
      });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
