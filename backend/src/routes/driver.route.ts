import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import * as driverService from "../services/driver.service.js";
import type { AuthRequest } from "../types/index.js";

const router = express.Router();

// ─── Driver self-service endpoints (must be before /:id routes) ──────────────

router.get("/me/profile", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await driverService.getDriverProfile(user.id);
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    res.json({ success: true, driver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/me/trips", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await driverService.getDriverProfile(user.id);
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    const { filter } = req.query;
    const schedules = await driverService.getDriverTrips(driver.id, filter as string);
    res.json({ success: true, schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/me/stats", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await driverService.getDriverProfile(user.id);
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    const stats = await driverService.getDriverSelfStats(driver.id);
    res.json({ success: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get(
  "/me/schedules/:scheduleId/passengers",
  protect,
  authorize("driver"),
  async (req, res) => {
    try {
      const { user } = req as AuthRequest;
      const driver = await driverService.getDriverProfile(user.id);
      if (!driver) {
        res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
        return;
      }

      const scheduleId = String(req.params.scheduleId);
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: { route: true },
      });
      if (!schedule) {
        res.status(404).json({ success: false, message: "Horaire non trouvé" });
        return;
      }
      if (schedule.driverId !== driver.id) {
        res.status(403).json({
          success: false,
          message: "Ce voyage ne vous est pas assigné",
        });
        return;
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          scheduleId,
          status: { in: ["confirmed", "pending"] },
        },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          seats: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const totalPassengers = reservations.reduce(
        (sum, r) => sum + r.seats.length,
        0,
      );
      const confirmedSeats = reservations
        .filter((r) => r.status === "confirmed")
        .reduce((sum, r) => sum + r.seats.length, 0);
      const pendingSeats = reservations
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + r.seats.length, 0);
      const revenue = reservations
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + r.totalPrice, 0);

      res.json({
        success: true,
        schedule,
        passengers: reservations.map((r) => ({
          reservationId: r.id,
          bookingReference: r.bookingReference,
          status: r.status,
          paymentStatus: r.paymentStatus,
          seats: r.seats.map((s) => s.seatNumber),
          totalPrice: r.totalPrice,
          user: r.user,
          createdAt: r.createdAt,
        })),
        summary: {
          totalPassengers,
          totalReservations: reservations.length,
          confirmed: confirmedSeats,
          pending: pendingSeats,
          revenue,
          occupancyRate:
            schedule.totalSeats > 0
              ? Math.round((totalPassengers / schedule.totalSeats) * 100)
              : 0,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },
);

router.put("/me/profile", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await driverService.getDriverProfile(user.id);
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }

    const { firstName, lastName, phone, licenseNumber, vehicleNumber, vehicleType } = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      licenseNumber?: string;
      vehicleNumber?: string;
      vehicleType?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !licenseNumber?.trim()) {
      res.status(400).json({
        success: false,
        message: "Nom, prénom, téléphone et permis sont requis",
      });
      return;
    }

    const allowedVehicles = ["Crafter", "Sprinter", "Transit"];
    const vt = allowedVehicles.includes(vehicleType ?? "")
      ? vehicleType
      : driver.vehicleType;

    try {
      const updated = await driverService.updateDriverSelf(driver.id, {
        userId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        vehicleNumber: (vehicleNumber ?? "").trim(),
        vehicleType: vt!,
      });
      res.json({ success: true, driver: updated });
    } catch (innerErr: unknown) {
      if (innerErr && typeof innerErr === "object" && "code" in innerErr && (innerErr as { code: string }).code === "P2002") {
        res.status(400).json({ success: false, message: "Numéro de permis déjà utilisé" });
        return;
      }
      throw innerErr;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── GET all drivers (admin + caissier) ──────────────────────────────────────
router.get("/", protect, authorize("admin", "caissier"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const drivers = await driverService.listDrivers({
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, drivers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── GET single driver + trip history ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const result = await driverService.getDriverWithHistory(String(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, message: "Chauffeur introuvable" });
      return;
    }
    res.json({ success: true, driver: result.driver, schedules: result.schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── CREATE driver ────────────────────────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { firstName, lastName, phone, licenseNumber, vehicleNumber, vehicleType, status } = req.body;

    if (!firstName || !lastName || !phone || !licenseNumber) {
      res.status(400).json({ success: false, message: "firstName, lastName, phone et licenseNumber sont requis" });
      return;
    }

    const driver = await driverService.createDriver({
      firstName, lastName, phone, licenseNumber,
      vehicleNumber, vehicleType, status,
    });
    res.status(201).json({ success: true, driver });
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(400).json({ success: false, message: "Numéro de permis déjà utilisé" });
      return;
    }
    console.error(err);
    res.status(400).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── UPDATE driver ────────────────────────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const driver = await driverService.updateDriver(String(req.params.id), req.body);
    res.json({ success: true, driver });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Chauffeur introuvable" });
    }
    console.error(err);
    res.status(400).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── DELETE driver ────────────────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await driverService.deleteDriver(String(req.params.id));
    res.json({ success: true, message: "Chauffeur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ─── GET stats ────────────────────────────────────────────────────────────────
router.get("/:id/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const stats = await driverService.getDriverAdminStats(String(req.params.id));
    res.json({ success: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
