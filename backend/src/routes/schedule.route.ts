import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Driver from "../models/driver.model.js";
import Schedule from "../models/schedule.model.js";

const router = express.Router();

router.get("/", scheduleController.getSchedules);
router.get(
  "/history",
  protect,
  authorize("admin"),
  scheduleController.getSheduleHistory,
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

      const schedule = await Schedule.findById(req.params.id);
      if (!schedule)
        return res
          .status(404)
          .json({ success: false, message: "Horaire introuvable" });

      const driver = await Driver.findById(driverId);
      if (!driver)
        return res
          .status(404)
          .json({ success: false, message: "Chauffeur introuvable" });

      const previousDriver = schedule.driver;

      schedule.driver = driverId;
      schedule.vehicleNumber = vehicleNumber || driver.vehicleNumber;

      schedule.history = schedule.history || [];
      schedule.history.push({
        action: "assigned_driver",
        performedBy: "admin",
        timestamp: new Date(),
        details: `Chauffeur assigné: ${driver.firstName} ${driver.lastName}`,
        previousValue: previousDriver?.toString() || "Aucun",
        newValue: `${driver.firstName} ${driver.lastName} (${schedule.vehicleNumber})`,
      });

      await schedule.save();

      // Update driver status
      await Driver.findByIdAndUpdate(driverId, { status: "on_trip" });

      res.json({ success: true, schedule });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },
);

export default router;
