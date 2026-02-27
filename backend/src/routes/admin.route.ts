import express from "express";
import { sendReservationConfirmation } from "../config/email.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import Reservation from "../models/reservation.model.js";
import Route from "../models/route.model.js";
import Schedule from "../models/schedule.model.js";
import User from "../models/user.model.js";
import {
  endOfLocalDay,
  parseLocalDate,
  toLocalDateString,
} from "../utils/date.utils.js";

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
        res.status(400).json({
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
        expiresAt: null,
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

// ─── GET all schedules (main list — avec option historique) ──────────────────
router.get("/schedules", protect, authorize("admin"), async (req, res) => {
  try {
    const { includeHistory, routeId, status } = req.query;

    const filter: Record<string, unknown> = {};

    if (!(includeHistory === "true")) {
      // Par défaut : 7 derniers jours + futur (exclut les vieux voyages terminés)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      filter.date = { $gte: sevenDaysAgo };
    }

    if (routeId) filter.route = routeId;
    if (status && status !== "all") filter.status = status;

    const schedules = await Schedule.find(filter)
      .populate("route", "departure destination duration price")
      .populate(
        "driver",
        "firstName lastName phone vehicleNumber vehicleType status",
      )
      .sort({ date: 1, time: 1 });

    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// ─── GET historique paginé des voyages passés ─────────────────────────────────
router.get(
  "/schedules/history",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 25,
        status,
        routeId,
        driverId,
        from,
        to,
      } = req.query;

      const now = new Date();

      // Base filter : tout ce qui est passé ou terminé/annulé
      let filter: Record<string, unknown> = {
        $or: [
          { status: { $in: ["completed", "cancelled"] } },
          { status: { $in: ["scheduled", "in_progress"] }, date: { $lt: now } },
        ],
      };

      if (status && status !== "all") {
        filter = { status };
      }
      if (routeId) filter.route = routeId;
      if (driverId) filter.driver = driverId;
      if (from || to) {
        filter.date = {};
        if (from) (filter.date as any).$gte = parseLocalDate(String(from));
        if (to)
          (filter.date as any).$lte = endOfLocalDay(parseLocalDate(String(to)));
      }

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [schedules, total] = await Promise.all([
        Schedule.find(filter)
          .populate("route", "departure destination duration price")
          .populate("driver", "firstName lastName phone vehicleNumber")
          .sort({ date: -1, time: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Schedule.countDocuments(filter),
      ]);

      // Stats globales sur tout le dataset filtré (pas juste la page courante)
      const [agg, cCompleted, cCancelled] = await Promise.all([
        Schedule.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $multiply: [
                    { $subtract: ["$totalSeats", "$availableSeats"] },
                    "$price",
                  ],
                },
              },
              totalPassengers: {
                $sum: { $subtract: ["$totalSeats", "$availableSeats"] },
              },
            },
          },
        ]),
        Schedule.countDocuments({ ...filter, status: "completed" }),
        Schedule.countDocuments({ ...filter, status: "cancelled" }),
      ]);

      res.json({
        success: true,
        schedules,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        globalStats: {
          total,
          completed: cCompleted,
          cancelled: cCancelled,
          totalRevenue: agg[0]?.totalRevenue ?? 0,
          totalPassengers: agg[0]?.totalPassengers ?? 0,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Preview schedules (dry-run, no DB write) ─────────────────────────────────
router.post(
  "/schedules/preview",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { routeId, startDate, endDate, times, price, vehicle } = req.body;

      if (!routeId || !startDate || !endDate || !times?.length) {
        res.status(400).json({
          success: false,
          message: "routeId, startDate, endDate et times sont requis",
        });
        return;
      }

      const route = await Route.findById(routeId);
      if (!route) {
        res.status(404).json({ success: false, message: "Route non trouvée" });
        return;
      }

      const start = parseLocalDate(startDate);
      const end = endOfLocalDay(parseLocalDate(endDate));
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      console.log("StartDate: ", startDate, "start: ", start);

      if (start > end) {
        res.status(400).json({
          success: false,
          message: "La date de début doit être avant la date de fin",
        });
        return;
      }

      const now = new Date();
      const preview: {
        id: string;
        date: string;
        dateFormatted: string;
        dayOfWeek: string;
        time: string;
        price: number;
        vehicle: string;
        status: "new" | "exists" | "past";
      }[] = [];

      const DAY_NAMES = [
        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
      ];

      const current = new Date(start);

      while (current <= end) {
        for (const time of times) {
          const [hours, minutes] = time.split(":").map(Number);
          const departure = new Date(current);
          departure.setHours(hours!, minutes!, 0, 0);

          let status: "new" | "exists" | "past" = "new";

          if (departure <= now) {
            status = "past";
          } else {
            const dayStart = new Date(current);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(current);
            dayEnd.setHours(23, 59, 59, 999);

            const existing = await Schedule.findOne({
              route: routeId,
              date: { $gte: dayStart, $lt: dayEnd },
              time,
            });
            if (existing) status = "exists";
          }

          preview.push({
            id: `${toLocalDateString(current)}-${time}`,
            date: toLocalDateString(current),
            dateFormatted: current.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            dayOfWeek: DAY_NAMES[current.getDay()]!,
            time,
            price: price || route.price,
            vehicle: vehicle || "Crafter",
            status,
          });
        }

        current.setDate(current.getDate() + 1);
      }

      const summary = {
        total: preview.length,
        new: preview.filter((p) => p.status === "new").length,
        exists: preview.filter((p) => p.status === "exists").length,
        past: preview.filter((p) => p.status === "past").length,
      };

      res.json({
        success: true,
        route: {
          _id: route._id,
          departure: route.departure,
          destination: route.destination,
        },
        preview,
        summary,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

// ─── Generate schedules in bulk ───────────────────────────────────────────────
router.post(
  "/schedules/generate",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      // items = array of { date, time, price, vehicle } after user edits in preview
      const { items } = req.body as {
        items: {
          routeId: string;
          date: string;
          time: string;
          price: number;
          vehicle: string;
        }[];
      };

      if (!items?.length) {
        res.status(400).json({
          success: false,
          message: "Aucun horaire à créer",
        });
        return;
      }

      const now = new Date();
      const schedulesToCreate: any[] = [];
      const skipped: { date: string; time: string; reason: string }[] = [];

      for (const item of items) {
        const [hours, minutes] = item.time.split(":").map(Number);
        const departure = parseLocalDate(item.date);
        departure.setHours(hours!, minutes!, 0, 0);

        if (departure <= now) {
          skipped.push({
            date: item.date,
            time: item.time,
            reason: "Départ dans le passé",
          });
          continue;
        }

        const dayStart = parseLocalDate(item.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = endOfLocalDay(parseLocalDate(item.date));
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await Schedule.findOne({
          route: item.routeId,
          date: { $gte: dayStart, $lt: dayEnd },
          time: item.time,
        });

        if (existing) {
          skipped.push({
            date: item.date,
            time: item.time,
            reason: "Déjà existant",
          });
          continue;
        }

        const route = await Route.findById(item.routeId);
        if (!route) {
          skipped.push({
            date: item.date,
            time: item.time,
            reason: "Route introuvable",
          });
          continue;
        }

        schedulesToCreate.push({
          route: item.routeId,
          date: new Date(item.date),
          time: item.time,
          vehicle: item.vehicle || "Crafter",
          totalSeats: 16,
          availableSeats: 16,
          occupiedSeats: [],
          price: item.price,
          status: "scheduled",
        });
      }

      if (schedulesToCreate.length === 0) {
        res.status(400).json({
          success: false,
          message: "Aucun horaire valide à créer",
          skipped,
        });
        return;
      }

      const created = await Schedule.insertMany(schedulesToCreate);

      res.status(201).json({
        success: true,
        message: `${created.length} horaire(s) créé(s) avec succès`,
        created: created.length,
        skipped: skipped.length,
        skippedDetails: skipped,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

export default router;
