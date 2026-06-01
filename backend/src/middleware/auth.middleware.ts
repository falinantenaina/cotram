import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";

interface JwtPayload {
  id: string;
}

export const protect: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Non autorisé. Token manquant",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
      return;
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }
};

export const authorize = (...roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
      return;
    }
    next();
  };
};

export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user?.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: "Veuillez vérifier votre email avant de continuer",
    });
    return;
  }
  next();
};
