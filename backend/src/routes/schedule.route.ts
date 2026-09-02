import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import * as scheduleService from "../services/schedule.service.js";
import type { AuthRequest } from "../types/index.js";

const router = express.Router();

router.get("/", scheduleController.getSchedules);
router.get(
  "/history",
  protect,
  authorize("admin"),
  scheduleController.getScheduleHistory,
);
router.get("/:id", scheduleController.getSchedule);
router.post(
  "/",
  protect,
  authorize("admin"),
  scheduleController.createSchedule,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  scheduleController.updateSchedule,
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  scheduleController.deleteSchedule,
);

router.put(
  "/:id/assign-driver",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { driverId, vehicleNumber } = req.body;
      const { user } = req as AuthRequest;

      if (driverId) {
        const result = await scheduleService.assignDriver(
          String(req.params.id),
          driverId,
          vehicleNumber,
          user.id,
        );
        if (!result.success) {
          res.status(result.status!).json({ success: false, message: result.message });
          return;
        }
        res.json({ success: true, schedule: result.schedule });
      } else {
        const result = await scheduleService.unassignDriver(
          String(req.params.id),
          user.id,
        );
        if (!result.success) {
          res.status(result.status!).json({ success: false, message: result.message });
          return;
        }
        res.json({ success: true, schedule: result.schedule });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },
);

export default router;
