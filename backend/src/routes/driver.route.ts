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
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

router.get("/me/trips", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await prisma.driver.findUnique({
      where: { userId: user.id },
    });
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    const { filter } = req.query;
    const schedules = await driverService.getDriverTrips(driver.id, filter as string);
    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

router.get("/me/stats", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    const stats = await driverService.getDriverSelfStats(driver.id);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET all drivers (admin) ─────────────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const drivers = await driverService.listDrivers({
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
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
    res.status(500).json({ success: false, message: (err as Error).message });
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
    res.status(400).json({ success: false, message: err.message });
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
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE driver ────────────────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await driverService.deleteDriver(String(req.params.id));
    res.json({ success: true, message: "Chauffeur supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET stats ────────────────────────────────────────────────────────────────
router.get("/:id/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const stats = await driverService.getDriverAdminStats(String(req.params.id));
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

export default router;
