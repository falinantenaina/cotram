import type { Request, Response } from "express";
import SeatTemplate from "../models/seatTemplate.model.js";

export const getTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await SeatTemplate.find().sort({ name: 1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, seatConfig } = req.body;
    if (!name || !seatConfig)
      return res
        .status(400)
        .json({ success: false, message: "name et seatConfig requis" });
    const template = await SeatTemplate.create({ name, seatConfig });
    res.status(201).json({ success: true, template });
  } catch (err: any) {
    const msg =
      err.code === 11000 ? "Ce nom existe déjà" : (err as Error).message;
    res.status(400).json({ success: false, message: msg });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { name, seatConfig } = req.body;
    const template = await SeatTemplate.findById(req.params.id);
    if (!template)
      return res
        .status(404)
        .json({ success: false, message: "Template non trouvé" });
    if (name) template.name = name;
    if (seatConfig !== undefined) {
      template.seatConfig = seatConfig;
      template.markModified("seatConfig");
    }
    await template.save();
    res.json({ success: true, template });
  } catch (err: any) {
    const msg =
      err.code === 11000 ? "Ce nom existe déjà" : (err as Error).message;
    res.status(400).json({ success: false, message: msg });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await SeatTemplate.findByIdAndDelete(req.params.id);
    if (!template)
      return res
        .status(404)
        .json({ success: false, message: "Template non trouvé" });
    res.json({ success: true, message: "Template supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
