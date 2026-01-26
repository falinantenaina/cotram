import express from "express";
import { protect } from "../middleware/auth.middleware.js";

import * as reservationController from "../controllers/reservation.controller.js";

const router = express.Router();

router.get("/", protect, reservationController.getReservations);
router.get("/:id", protect, reservationController.getReservation);
router.post("/", protect, reservationController.createReservation);
router.put("/:id/confirm", protect, reservationController.confirmReservation);
router.put("/:id/cancel", protect, reservationController.cancelReservation);
/* router.delete(
  "/:id",
  protect,
  authorize("admin"),
  reservationController.deleteReservation,
); */

export default router;
