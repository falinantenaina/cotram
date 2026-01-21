import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes, veuillez réessayer plus tard.",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
});

export const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Trop de réservations, veuillez réessayer plus tard.",
});

export const sanitiezInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next();
};
