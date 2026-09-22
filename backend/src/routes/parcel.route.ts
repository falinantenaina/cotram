import express from "express";
import * as parcelController from "../controllers/parcel.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public tracking (no auth) — must be before /:id
router.get("/track/:code", parcelController.trackParcel);

// Schedules filtered for parcel assignment
router.get(
  "/schedules",
  protect,
  authorize("admin", "agent"),
  parcelController.getSchedulesForParcels,
);

// Stats (admin)
router.get(
  "/stats",
  protect,
  authorize("admin"),
  parcelController.getParcelStats,
);

// List (admin + agent)
router.get(
  "/",
  protect,
  authorize("admin", "agent"),
  parcelController.getParcels,
);

// Detail (admin + agent)
router.get(
  "/:id",
  protect,
  authorize("admin", "agent"),
  parcelController.getParcel,
);

// Create (admin + agent)
router.post(
  "/",
  protect,
  authorize("admin", "agent"),
  parcelController.createParcel,
);

// Update (admin only)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  parcelController.updateParcel,
);

// Status transition (admin + agent)
router.put(
  "/:id/status",
  protect,
  authorize("admin", "agent"),
  parcelController.updateParcelStatus,
);

// Payment (admin + agent)
router.post(
  "/:id/pay",
  protect,
  authorize("admin", "agent"),
  parcelController.recordPayment,
);

// Delete (admin only, registered only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  parcelController.deleteParcel,
);

export default router;
