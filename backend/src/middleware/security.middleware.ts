import type { NextFunction, Request, Response } from "express";
import * as rateLimitPkg from "express-rate-limit";
const rateLimit = (rateLimitPkg as any).default ?? rateLimitPkg;

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Trop de requêtes, veuillez réessayer plus tard.",
  skip: (req: { path: string }) => {
    const ext = req.path.split(".").pop();
    return ["css", "js", "png", "jpg", "jpeg", "webp", "svg", "ico", "woff", "woff2"].includes(ext ?? "");
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
});

export const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Trop de réservations, veuillez réessayer plus tard.",
});

export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/\bon\w+\s*=/gi, "")
          .trim();
      }
    }
  }
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === "string") {
        req.query[key] = (req.query[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/\bon\w+\s*=/gi, "")
          .trim();
      }
    }
  }
  next();
};
