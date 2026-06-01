import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// ─── GET all drivers ──────────────────────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const where: any = {};

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
        route: { select: { departure: true, destination: true, duration: true, price: true } },
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
    const driver = await prisma.driver.create({
      data: req.body,
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
    const driver = await prisma.driver.update({
      where: { id: String(req.params.id) },
      data: req.body,
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
