import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Driver from "../models/driver.model.js";
import Schedule from "../models/schedule.model.js";

const router = express.Router();

async function syncDriverStatus(driverId: string): Promise<void> {
  const driver = await Driver.findById(driverId);
  if (!driver) return;

  // Ne pas écraser off_duty ou suspended — ces statuts sont gérés manuellement
  if (driver.status === "off_duty" || driver.status === "suspended") return;

  const hasActiveTrip = await Schedule.exists({
    driver: driverId,
    status: "in_progress",
  });

  const newStatus = hasActiveTrip ? "on_trip" : "available";

  if (driver.status !== newStatus) {
    await Driver.findByIdAndUpdate(driverId, { status: newStatus });
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

      const schedule = await Schedule.findById(req.params.id);
      if (!schedule)
        return res
          .status(404)
          .json({ success: false, message: "Horaire introuvable" });

      // Vérifier que le chauffeur n'est pas déjà assigné à un voyage
      // qui chevauche la même plage horaire (même jour, heure proche)
      if (driverId) {
        const driver = await Driver.findById(driverId);
        if (!driver)
          return res
            .status(404)
            .json({ success: false, message: "Chauffeur introuvable" });

        // Vérifier conflit : même chauffeur, même date, statut scheduled/in_progress
        // On exclut le schedule courant (cas de réassignation)
        const conflict = await Schedule.findOne({
          _id: { $ne: schedule._id },
          driver: driverId,
          date: schedule.date,
          time: schedule.time,
          status: { $in: ["scheduled", "in_progress"] },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Ce chauffeur est déjà assigné à un voyage à ${conflict.time} le même jour.`,
          });
        }

        const previousDriver = schedule.driver;

        schedule.driver = driverId as any;
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

        // Si l'ancien chauffeur était différent, recalculer son statut aussi
        if (previousDriver && previousDriver.toString() !== driverId) {
          await syncDriverStatus(previousDriver.toString());
        }

        // Recalculer le statut du nouveau chauffeur (ne pas forcer on_trip)
        await syncDriverStatus(driverId);
      } else {
        // driverId null/vide = désassigner le chauffeur
        const previousDriver = schedule.driver;

        schedule.driver = null as any;
        schedule.vehicleNumber = null;

        schedule.history = schedule.history || [];
        schedule.history.push({
          action: "unassigned_driver",
          performedBy: "admin",
          timestamp: new Date(),
          details: "Chauffeur retiré",
        });

        await schedule.save();

        // Recalculer le statut de l'ancien chauffeur
        if (previousDriver) {
          await syncDriverStatus(previousDriver.toString());
        }
      }

      // Repopuler le schedule avec les données du driver pour le frontend
      const populated = await Schedule.findById(schedule._id).populate(
        "driver",
        "firstName lastName phone vehicleNumber vehicleType status",
      );

      res.json({ success: true, schedule: populated });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },
);

export default router;
