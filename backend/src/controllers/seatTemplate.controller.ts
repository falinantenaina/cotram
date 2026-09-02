import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.seatTemplate.findMany({
      orderBy: [{ isPreset: "desc" }, { name: "asc" }],
    });
    res.json({ success: true, templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, seatConfig } = req.body;
    if (!name || !seatConfig)
      return res
        .status(400)
        .json({ success: false, message: "name et seatConfig requis" });
    const template = await prisma.seatTemplate.create({
      data: { name, seatConfig, isPreset: false },
    });
    res.status(201).json({ success: true, template });
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(400).json({ success: false, message: "Ce nom existe déjà" });
      return;
    }
    console.error(err);
    res.status(400).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { name, seatConfig } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (seatConfig !== undefined) data.seatConfig = seatConfig;

    const template = await prisma.seatTemplate.update({
      where: { id: String(req.params.id) },
      data,
    });

    // Propager le nouveau seatConfig à tous les schedules liés
    if (seatConfig !== undefined) {
      const totalSeats = (seatConfig as any)?.totalSeats ?? undefined;
      const updateData: any = { seatConfig };
      if (totalSeats !== undefined) {
        updateData.totalSeats = totalSeats;
      }
      await prisma.schedule.updateMany({
        where: { seatTemplateId: template.id },
        data: updateData,
      });
    }

    res.json({ success: true, template });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({ success: false, message: "Template non trouvé" });
      return;
    }
    if (err.code === "P2002") {
      res.status(400).json({ success: false, message: "Ce nom existe déjà" });
      return;
    }
    console.error(err);
    res.status(400).json({ success: false, message: "Erreur serveur" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const template = await prisma.seatTemplate.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!template) {
      res.status(404).json({ success: false, message: "Template non trouvé" });
      return;
    }
    await prisma.seatTemplate.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ success: true, message: "Template supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
