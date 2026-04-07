import type { Request, Response } from "express";
import VehicleTemplate from "../models/vehicleTemplate.model.js";

type VehicleType = "Crafter" | "Sprinter" | "Transit";

// GET /api/vehicle-templates — tous les templates
export const getTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await VehicleTemplate.find();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

// GET /api/vehicle-templates/:vehicleType — un template
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const vehicleType = req.params.vehicleType as VehicleType;
    const template = await VehicleTemplate.findOne({ vehicleType });
    if (!template) {
      res
        .status(404)
        .json({ success: false, message: "Aucun template pour ce véhicule" });
      return;
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
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

    const template = await VehicleTemplate.findOneAndUpdate(
      { vehicleType },
      { vehicleType, seatConfig, $set: { updatedAt: new Date() } },
      { upsert: true, new: true },
    );

    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
