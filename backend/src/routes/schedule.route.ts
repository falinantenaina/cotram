import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import * as scheduleService from "../services/schedule.service.js";
import { emitToStaffAndDrivers, emitToUser } from "../lib/socket.js";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";

const router = express.Router();

router.get("/", scheduleController.getSchedules);
router.get(
  "/history",
  protect,
  authorize("admin", "caissier"),
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
        emitToStaffAndDrivers("schedule:updated", { id: String(req.params.id), action: "driver" });
        // Notify the assigned driver user directly
        try {
          const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: { userId: true },
          });
          if (driver?.userId) {
            emitToUser(driver.userId, "schedule:assigned", {
              id: String(req.params.id),
            });
          }
        } catch {
          // non-blocking
        }
        res.json({ success: true, schedule: result.schedule });
      } else {
        const previous = await prisma.schedule.findUnique({
          where: { id: String(req.params.id) },
          select: { driverId: true },
        });
        const result = await scheduleService.unassignDriver(
          String(req.params.id),
          user.id,
        );
        if (!result.success) {
          res.status(result.status!).json({ success: false, message: result.message });
          return;
        }
        emitToStaffAndDrivers("schedule:updated", { id: String(req.params.id), action: "driver" });
        if (previous?.driverId) {
          try {
            const driver = await prisma.driver.findUnique({
              where: { id: previous.driverId },
              select: { userId: true },
            });
            if (driver?.userId) {
              emitToUser(driver.userId, "schedule:unassigned", {
                id: String(req.params.id),
              });
            }
          } catch {
            // non-blocking
          }
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
