import type { Request, Response } from "express";
import Route from "../models/route.model.js";

export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = await Route.find({ isActive: true });
    res.json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const route = await Route.findById(req.params.id);

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

    const route = await Route.create({
      departure,
      destination,
      duration,
      distance,
      price,
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
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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

export const deleteRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      res.status(404).json({
        success: false,
        message: "Trajet non trouvé",
      });
      return;
    }

    res.json({ success: true, message: "Trajet supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
