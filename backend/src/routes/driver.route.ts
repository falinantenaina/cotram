import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Driver from "../models/driver.model.js";
import Schedule from "../models/schedule.model.js";

const router = express.Router();

// ─── GET all drivers ──────────────────────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") filter.status = status;
    if (search) {
      const q = new RegExp(String(search), "i");
      filter.$or = [
        { firstName: q },
        { lastName: q },
        { phone: q },
        { licenseNumber: q },
        { vehicleNumber: q },
      ];
    }

    const drivers = await Driver.find(filter).sort({ lastName: 1 });
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── GET single driver + trip history ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Chauffeur introuvable" });

    // Fetch all schedules assigned to this driver
    const schedules = await Schedule.find({ driver: driver._id })
      .populate("route", "departure destination duration price")
      .sort({ date: -1 })
      .limit(50);

    res.json({ success: true, driver, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// ─── CREATE driver ────────────────────────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, driver });
  } catch (err: any) {
    const msg =
      err.code === 11000 ? "Numéro de permis déjà utilisé" : err.message;
    res.status(400).json({ success: false, message: msg });
  }
});

// ─── UPDATE driver ────────────────────────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!driver)
      return res
        .status(404)
        .json({ success: false, message: "Chauffeur introuvable" });
    res.json({ success: true, driver });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE driver ────────────────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    // Unassign from future schedules
    await Schedule.updateMany(
      { driver: req.params.id, status: "scheduled" },
      { $unset: { driver: 1, vehicleNumber: 1 } },
    );
    await Driver.findByIdAndDelete(req.params.id);
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
      Schedule.countDocuments({ driver: req.params.id }),
      Schedule.countDocuments({ driver: req.params.id, status: "completed" }),
      Schedule.countDocuments({ driver: req.params.id, status: "cancelled" }),
      Schedule.countDocuments({
        driver: req.params.id,
        date: { $gte: thirtyDaysAgo },
      }),
      Schedule.countDocuments({
        driver: req.params.id,
        status: "scheduled",
        date: { $gte: now },
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
