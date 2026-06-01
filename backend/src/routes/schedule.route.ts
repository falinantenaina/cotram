import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

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
            time: schedule.time,
            status: { in: ["scheduled", "in_progress"] },
          },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Ce chauffeur est déjà assigné à un voyage à ${conflict.time} le même jour.`,
          });
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
