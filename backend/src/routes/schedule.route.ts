import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import {
  parseDurationToMinutes,
  hasTimeOverlap,
} from "../utils/date.utils.js";

const router = express.Router();

async function syncDriverStatus(driverId: string): Promise<void> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  if (!driver) return;

  if (driver.status === "off_duty" || driver.status === "suspended") return;

  const hasActiveTrip = await prisma.schedule.findFirst({
    where: {
      driverId,
      status: "in_progress",
    },
  });

  const newStatus = hasActiveTrip ? "on_trip" : "available";

  if (driver.status !== newStatus) {
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: newStatus },
    });
  }
}

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

      const schedule = await prisma.schedule.findUnique({
        where: { id: String(req.params.id) },
        include: { route: { select: { duration: true } } },
      });
      if (!schedule)
        return res
          .status(404)
          .json({ success: false, message: "Horaire introuvable" });

      if (driverId) {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
        });
        if (!driver)
          return res
            .status(404)
            .json({ success: false, message: "Chauffeur introuvable" });

        const conflict = await prisma.schedule.findFirst({
          where: {
            id: { not: schedule.id },
            driverId,
            date: schedule.date,
            status: { in: ["scheduled", "in_progress"] },
          },
          include: { route: { select: { duration: true } } },
        });

        if (conflict) {
          const [targetH, targetM] = schedule.time.split(":").map(Number);
          const targetStart = targetH! * 60 + targetM!;
          const targetDuration = parseDurationToMinutes(
            schedule.route?.duration ?? "2h",
          );
          const targetEnd = targetStart + targetDuration;

          const [conflictH, conflictM] = conflict.time.split(":").map(Number);
          const conflictStart = conflictH! * 60 + conflictM!;
          const conflictDuration = parseDurationToMinutes(
            conflict.route?.duration ?? "2h",
          );
          const conflictEnd = conflictStart + conflictDuration;

          if (hasTimeOverlap(targetStart, targetEnd, conflictStart, conflictEnd)) {
            return res.status(400).json({
              success: false,
              message: `Ce chauffeur est déjà assigné à un voyage à ${conflict.time} le même jour (durée: ${conflict.route?.duration}). Il ne sera pas disponible avant ${Math.floor(conflictEnd / 60)}h${String(conflictEnd % 60).padStart(2, "0")}.`,
            });
          }
        }

        const previousDriver = schedule.driverId;

        await prisma.$transaction([
          prisma.schedule.update({
            where: { id: schedule.id },
            data: {
              driverId,
              vehicleNumber: vehicleNumber || driver.vehicleNumber,
            },
          }),
          prisma.scheduleHistory.create({
            data: {
              scheduleId: schedule.id,
              action: "assigned_driver",
              performedBy: "admin",
              details: `Chauffeur assigné: ${driver.firstName} ${driver.lastName}`,
            },
          }),
        ]);

        if (previousDriver && previousDriver !== driverId) {
          await syncDriverStatus(previousDriver);
        }

        await syncDriverStatus(driverId);
      } else {
        const previousDriver = schedule.driverId;

        await prisma.$transaction([
          prisma.schedule.update({
            where: { id: schedule.id },
            data: {
              driverId: null,
              vehicleNumber: null,
            },
          }),
          prisma.scheduleHistory.create({
            data: {
              scheduleId: schedule.id,
              action: "unassigned_driver",
              performedBy: "admin",
              details: "Chauffeur retiré",
            },
          }),
        ]);

        if (previousDriver) {
          await syncDriverStatus(previousDriver);
        }
      }

      const populated = await prisma.schedule.findUnique({
        where: { id: schedule.id },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              vehicleNumber: true,
              vehicleType: true,
              status: true,
            },
          },
        },
      });

      res.json({ success: true, schedule: populated });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },
);

export default router;
