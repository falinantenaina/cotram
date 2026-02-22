import express from "express";
import { sendReservationConfirmation } from "../config/email.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Reservation from "../models/reservation.model.js";
import Route from "../models/route.model.js";
import Schedule from "../models/schedule.model.js";
import User from "../models/user.model.js";

const router = express.Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayReservations,
      totalUsers,
      activeRoutes,
      monthlyReservations,
      pendingCount,
    ] = await Promise.all([
      Reservation.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ role: "user" }),
      Route.countDocuments({ isActive: true }),
      Reservation.find({
        createdAt: { $gte: firstDayOfMonth },
        paymentStatus: "paid",
      }),
      Reservation.countDocuments({ status: "pending" }),
    ]);

    const monthlyRevenue = monthlyReservations.reduce(
      (sum, r) => sum + r.totalPrice,
      0,
    );

    res.json({
      success: true,
      todayReservations,
      totalUsers,
      activeRoutes,
      monthlyRevenue,
      pendingCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// ─── Today's schedules with passengers ────────────────────────────────────────
router.get(
  "/today-schedules",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const schedules = await Schedule.find({
        date: { $gte: today, $lt: tomorrow },
        status: { $ne: "cancelled" },
      })
        .populate("route")
        .sort({ time: 1 });

      const schedulesWithStats = await Promise.all(
        schedules.map(async (schedule) => {
          const reservations = await Reservation.find({
            schedule: schedule._id,
            status: { $in: ["confirmed", "pending"] },
          }).populate("user", "name email phone");

          return {
            ...schedule.toObject(),
            reservations,
            passengerCount: reservations.reduce(
              (sum, r) => sum + r.seats.length,
              0,
            ),
          };
        }),
      );

      res.json({ success: true, schedules: schedulesWithStats });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Schedule passengers manifest ─────────────────────────────────────────────
router.get(
  "/schedules/:scheduleId/passengers",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const schedule = await Schedule.findById(req.params.scheduleId).populate(
        "route",
      );
      if (!schedule) {
        res.status(404).json({ success: false, message: "Horaire non trouvé" });
        return;
      }

      const reservations = await Reservation.find({
        schedule: req.params.scheduleId,
        status: { $in: ["confirmed", "pending"] },
      })
        .populate("user", "name email phone")
        .sort({ createdAt: 1 });

      const totalPassengers = reservations.reduce(
        (sum, r) => sum + r.seats.length,
        0,
      );
      const revenue = reservations
        .filter((r) => r.paymentStatus === "paid")
        .reduce((sum, r) => sum + r.totalPrice, 0);

      res.json({
        success: true,
        schedule,
        passengers: reservations.map((r) => ({
          reservationId: r._id,
          bookingReference: r.bookingReference,
          status: r.status,
          paymentStatus: r.paymentStatus,
          seats: r.seats,
          totalPrice: r.totalPrice,
          user: r.user,
          createdAt: r.createdAt,
        })),
        summary: {
          totalPassengers,
          totalReservations: reservations.length,
          confirmed: reservations.filter((r) => r.status === "confirmed")
            .length,
          pending: reservations.filter((r) => r.status === "pending").length,
          revenue,
          occupancyRate: Math.round(
            (totalPassengers / schedule.totalSeats) * 100,
          ),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Recent reservations ───────────────────────────────────────────────────────
router.get(
  "/recent-reservations",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const reservations = await Reservation.find()
        .populate({ path: "schedule", populate: { path: "route" } })
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .limit(8);

      res.json({ success: true, reservations });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Walk-in reservation ───────────────────────────────────────────────────────
router.post(
  "/reservations/walk-in",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { name, phone, scheduleId, seats } = req.body;

      if (!name || !scheduleId || !seats || seats.length === 0) {
        res
          .status(400)
          .json({
            success: false,
            message: "Nom, horaire et sièges sont requis",
          });
        return;
      }

      const schedule = await Schedule.findById(scheduleId).populate("route");
      if (!schedule) {
        res.status(404).json({ success: false, message: "Horaire non trouvé" });
        return;
      }

      const unavailableSeats = seats.filter((seat: number) =>
        schedule.occupiedSeats.includes(seat),
      );
      if (unavailableSeats.length > 0) {
        res.status(400).json({
          success: false,
          message: "Certains sièges sont déjà occupés",
          unavailableSeats,
        });
        return;
      }

      let user = phone ? await User.findOne({ phone }) : null;
      if (!user) {
        const tempEmail = phone
          ? `walkin_${phone.replace(/\s/g, "")}@cotram.local`
          : `walkin_${Date.now()}@cotram.local`;
        user = await User.create({
          name,
          email: tempEmail,
          phone: phone || undefined,
          role: "user",
          isEmailVerified: false,
        });
      } else if (user.name !== name) {
        user.name = name;
        await user.save();
      }

      const totalPrice = seats.length * schedule.price;
      const reservation = await Reservation.create({
        user: user._id,
        schedule: scheduleId,
        seats,
        totalPrice,
        status: "confirmed",
        paymentStatus: "paid",
      });

      schedule.occupiedSeats.push(...seats);
      schedule.availableSeats -= seats.length;
      await schedule.save();

      const populatedReservation = await Reservation.findById(reservation._id)
        .populate({ path: "schedule", populate: { path: "route" } })
        .populate("user");

      if (user.email && !user.email.includes("@cotram.local")) {
        try {
          const route = (populatedReservation!.schedule as any).route;
          await sendReservationConfirmation(
            user.email,
            user.name,
            reservation.bookingReference,
            {
              departure: route.departure,
              destination: route.destination,
              date: new Date(
                (populatedReservation!.schedule as any).date,
              ).toLocaleDateString("fr-FR"),
              time: (populatedReservation!.schedule as any).time,
              seats: reservation.seats,
              totalPrice: reservation.totalPrice,
            },
          );
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      res.status(201).json({
        success: true,
        reservation: populatedReservation,
        message: `Réservation créée avec succès — Référence: ${reservation.bookingReference}`,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Get all reservations (admin) ─────────────────────────────────────────────
router.get("/reservations", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate({ path: "schedule", populate: { path: "route" } })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;
