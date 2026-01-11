import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import type { AuthRequest } from "../types/index.js";

interface JwtPayload {
  id: string;
}

export const Protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non autorisé, Token manquant",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Protect middleware error :", error as Error);
    res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refué",
      });
    }
    next();
  };
};
