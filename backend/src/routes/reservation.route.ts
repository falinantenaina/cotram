import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.middleware.js";

import * as reservationController from "../controllers/reservation.controller.js";

const router = express.Router();

const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Trop de tentatives de réservation. Veuillez réessayer dans 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", protect, reservationController.getReservations);
router.get("/:id", protect, reservationController.getReservation);
router.post("/", protect, reservationLimiter, reservationController.createReservation);
router.put("/:id/confirm", protect, reservationController.confirmReservation);
router.put("/:id/cancel", protect, reservationController.cancelReservation);
/* router.delete(
  "/:id",
  protect,
  authorize("admin"),
  reservationController.deleteReservation,
); */

export default router;
