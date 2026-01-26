import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Reservation from "../models/reservation.model.js";
import Route from "../models/route.model.js";
import User from "../models/user.model.js";

const router = express.Router();
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayReservations = await Reservation.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const activeUsers = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });

    const activeRoutes = await Route.countDocuments({ isActive: true });

    const monthlyReservations = await Reservation.find({
      createdAt: { $gte: firstDayOfMonth },
      paymentStatus: "paid",
    });

    const monthlyRevenue = monthlyReservations.reduce(
      (sum, res) => sum + res.totalPrice,
      0,
    );

    res.json({
      success: true,
      todayReservations,
      activeUsers,
      activeRoutes,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});
export default router;
