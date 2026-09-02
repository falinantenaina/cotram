import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

type VehicleType = "Crafter" | "Sprinter" | "Transit";

// GET /api/vehicle-templates — tous les templates
export const getTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.vehicleTemplate.findMany();
    res.json({ success: true, templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/vehicle-templates/:vehicleType — un template
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const vehicleType = req.params.vehicleType as VehicleType;
    const template = await prisma.vehicleTemplate.findUnique({
      where: { vehicleType },
    });
    if (!template) {
      res
        .status(404)
        .json({ success: false, message: "Aucun template pour ce véhicule" });
      return;
    }
    res.json({ success: true, template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// PUT /api/vehicle-templates/:vehicleType — créer ou mettre à jour
export const upsertTemplate = async (req: Request, res: Response) => {
  try {
    const vehicleType = req.params.vehicleType as VehicleType;
    const { seatConfig } = req.body;

    if (!seatConfig) {
      res.status(400).json({ success: false, message: "seatConfig requis" });
      return;
    }

    const template = await prisma.vehicleTemplate.upsert({
      where: { vehicleType },
      update: { seatConfig },
      create: { vehicleType, seatConfig },
    });

    res.json({ success: true, template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
