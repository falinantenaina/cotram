import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";
import type { Prisma } from "@prisma/client";

const router = express.Router();

// ─── Driver self-service endpoints (must be before /:id routes) ──────────────

// GET /api/drivers/me/profile - Driver gets own profile
router.get("/me/profile", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await prisma.driver.findUnique({
      where: { userId: user.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
    });
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET /api/drivers/me/trips - Driver gets assigned trips
router.get("/me/trips", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }

    const { filter } = req.query;
    const now = new Date();

    let where: Prisma.ScheduleWhereInput = { driverId: driver.id };
    if (filter === "upcoming") {
      where = { ...where, status: "scheduled", date: { gte: now } };
    } else if (filter === "completed") {
      where = { ...where, status: "completed" };
    } else if (filter === "cancelled") {
      where = { ...where, status: "cancelled" };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: {
          include: { departure: true, destination: true },
        },
        _count: {
          select: {
            reservations: { where: { status: { not: "cancelled" } } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// GET /api/drivers/me/stats - Driver gets own stats
router.get("/me/stats", protect, authorize("driver"), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (!driver) {
      res.status(404).json({ success: false, message: "Profil chauffeur introuvable" });
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, completed, cancelled, upcoming, thisMonth] = await Promise.all([
      prisma.schedule.count({ where: { driverId: driver.id } }),
      prisma.schedule.count({ where: { driverId: driver.id, status: "completed" } }),
      prisma.schedule.count({ where: { driverId: driver.id, status: "cancelled" } }),
      prisma.schedule.count({ where: { driverId: driver.id, status: "scheduled", date: { gte: now } } }),
      prisma.schedule.count({ where: { driverId: driver.id, status: "completed", date: { gte: startOfMonth } } }),
    ]);

    res.json({ success: true, stats: { total, completed, cancelled, upcoming, thisMonth } });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET all drivers (admin) ─────────────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const where: Prisma.DriverWhereInput = {};

    if (status && status !== "all") where.status = status;
    if (search) {
      const q = String(search);
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { licenseNumber: { contains: q, mode: "insensitive" } },
        { vehicleNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { lastName: "asc" },
    });
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET single driver + trip history ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Chauffeur introuvable" });

    const schedules = await prisma.schedule.findMany({
      where: { driverId: driver.id },
      include: {
        route: {
          include: {
            departure: true,
            destination: true,
          },
          select: { duration: true, price: true },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    res.json({ success: true, driver, schedules });
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

    const driver = await prisma.driver.create({
      data: {
        firstName,
        lastName,
        phone,
        licenseNumber,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || "Crafter",
        status: status || "available",
      },
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
    const { firstName, lastName, phone, licenseNumber, vehicleNumber, vehicleType, status } = req.body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (phone !== undefined) data.phone = phone;
    if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
    if (vehicleNumber !== undefined) data.vehicleNumber = vehicleNumber;
    if (vehicleType !== undefined) data.vehicleType = vehicleType;
    if (status !== undefined) data.status = status;

    const driver = await prisma.driver.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json({ success: true, driver });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Chauffeur introuvable" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE driver ────────────────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await prisma.schedule.updateMany({
      where: {
        driverId: String(req.params.id),
        status: "scheduled",
      },
      data: {
        driverId: null,
        vehicleNumber: null,
      },
    });
    await prisma.driver.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ success: true, message: "Chauffeur supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET stats ────────────────────────────────────────────────────────────────
router.get("/:id/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, completed, cancelled, recent, upcoming] = await Promise.all([
      prisma.schedule.count({ where: { driverId: String(req.params.id) } }),
      prisma.schedule.count({ where: { driverId: String(req.params.id), status: "completed" } }),
      prisma.schedule.count({ where: { driverId: String(req.params.id), status: "cancelled" } }),
      prisma.schedule.count({
        where: {
          driverId: String(req.params.id),
          date: { gte: thirtyDaysAgo },
        },
      }),
      prisma.schedule.count({
        where: {
          driverId: String(req.params.id),
          status: "scheduled",
          date: { gte: now },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: { total, completed, cancelled, recent, upcoming },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

export default router;
