import type { Request, Response } from "express";
import User from "../models/user.model.js";
import type { AuthRequest } from "../types/index.js";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await User.findById(req.params["id"]).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    if (
      authReq.user.role !== "admin" &&
      authReq.user._id.toString() !== req.params["id"]
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
      authReq.user._id.toString() !== req.params["id"]
    ) {
      res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params["id"],
      { name, email, phone },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params["id"]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
