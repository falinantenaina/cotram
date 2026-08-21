import express from "express";
import { Prisma } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import { withOccupiedSeats, flattenReservationSeats } from "../utils/serialization.utils.js";
import { getDashboardStats } from "../services/adminStats.service.js";
import { getTodaySchedulesWithPassengers } from "../services/scheduleManifest.service.js";
import { createWalkinReservation, WalkinError } from "../services/reservationWalkin.service.js";
import {
  endOfLocalDay,
  parseLocalDate,
  toLocalDateString,
} from "../utils/date.utils.js";

const router = express.Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({ success: true, ...stats });
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
      const schedules = await getTodaySchedulesWithPassengers();
      res.json({ success: true, schedules });
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
      const schedule = await prisma.schedule.findUnique({
        where: { id: String(req.params.scheduleId) },
        include: { route: true },
      });
      if (!schedule) {
        res.status(404).json({ success: false, message: "Horaire non trouvé" });
        return;
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          scheduleId: String(req.params.scheduleId),
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
          confirmed: reservations.filter((r) => r.status === "confirmed").length,
          pending: reservations.filter((r) => r.status === "pending").length,
          revenue,
          occupancyRate: schedule.totalSeats > 0
            ? Math.round((totalPassengers / schedule.totalSeats) * 100)
            : 0,
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
      const reservations = await prisma.reservation.findMany({
        include: {
          schedule: {
            include: { route: true },
          },
          user: { select: { name: true, email: true, phone: true } },
          seats: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      res.json({ success: true, reservations: reservations.map(flattenReservationSeats) });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  },
);

const walkInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Trop de tentatives de réservation. Veuillez réessayer dans 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Walk-in reservation ───────────────────────────────────────────────────────
router.post(
  "/reservations/walk-in",
  protect,
  authorize("admin"),
  walkInLimiter,
  async (req, res) => {
    try {
      const { name, phone, scheduleId, seats } = req.body;

      if (!name || !scheduleId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({
          success: false,
          message: "Nom, horaire et sièges sont requis",
        });
        return;
      }

      if (seats.length > 30) {
        res.status(400).json({
          success: false,
          message: "Maximum 30 sièges par réservation",
        });
        return;
      }

      const populatedReservation = await createWalkinReservation({
        name,
        phone,
        scheduleId,
        seats,
      });

      res.status(201).json({
        success: true,
        reservation: flattenReservationSeats(populatedReservation as any),
        message: `Réservation créée avec succès — Référence: ${(populatedReservation as any).bookingReference}`,
      });
    } catch (error) {
      if (error instanceof WalkinError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(error.unavailableSeats && { unavailableSeats: error.unavailableSeats }),
        });
        return;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        res.status(409).json({
          success: false,
          message: "Conflit de réservation - ces sièges sont en cours de réservation par un autre utilisateur",
        });
        return;
      }
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
    const where: Prisma.ReservationWhereInput = {};
    if (status && status !== "all") {
      where.status = status as Prisma.EnumReservationStatusFilter["equals"];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        schedule: {
          include: { route: true },
        },
        user: { select: { name: true, email: true, phone: true } },
        seats: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, reservations: reservations.map(flattenReservationSeats) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// ─── GET all schedules (main list) ───────────────────────────────────────────
router.get("/schedules", protect, authorize("admin"), async (req, res) => {
  try {
    const { includeHistory, routeId, status } = req.query;

    const where: Prisma.ScheduleWhereInput = {};

    if (!(includeHistory === "true")) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      where.date = { gte: sevenDaysAgo };
    }

    if (routeId) where.routeId = String(routeId);
    if (status && status !== "all") {
      where.status = status as Prisma.EnumScheduleStatusFilter["equals"];
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: {
          include: {
            departure: true,
            destination: true,
          },
        },
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
        occupiedSeats: true,
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    res.json({ success: true, schedules: schedules.map(withOccupiedSeats) });
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

      let where: Prisma.ScheduleWhereInput = {
        OR: [
          { status: { in: ["completed", "cancelled"] } },
          { status: { in: ["scheduled", "in_progress"] }, date: { lt: now } },
        ],
      };

      if (status && status !== "all") {
        where = { ...where, status: status as Prisma.EnumScheduleStatusFilter["equals"] };
      }
      if (routeId) where.routeId = String(routeId);
      if (driverId) where.driverId = String(driverId);
      if (from || to) {
        where.date = {};
        if (from) (where.date as any).gte = parseLocalDate(String(from));
        if (to) (where.date as any).lte = endOfLocalDay(parseLocalDate(String(to)));
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(Math.max(1, Number(limit) || 25), 100);

      const [schedules, total] = await Promise.all([
        prisma.schedule.findMany({
          where,
          include: {
            route: {
              include: {
                departure: true,
                destination: true,
              },
            },
            driver: { select: { firstName: true, lastName: true, phone: true, vehicleNumber: true } },
            occupiedSeats: true,
          },
          orderBy: [{ date: "desc" }, { time: "desc" }],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.schedule.count({ where }),
      ]);

      const completedCount = await prisma.schedule.count({
        where: { ...where, status: "completed" },
      });
      const cancelledCount = await prisma.schedule.count({
        where: { ...where, status: "cancelled" },
      });

      const totalPassengersResult = await prisma.schedule.aggregate({
        where,
        _sum: { totalSeats: true, availableSeats: true },
      });

      const totalPassengers =
        (totalPassengersResult._sum.totalSeats ?? 0) -
        (totalPassengersResult._sum.availableSeats ?? 0);

      const totalRevenueResult = await prisma.schedule.findMany({
        where,
        select: { price: true, totalSeats: true, availableSeats: true },
      });
      const totalRevenue = totalRevenueResult.reduce((sum, s) => {
        const passengers = s.totalSeats - s.availableSeats;
        return sum + passengers * s.price;
      }, 0);

      res.json({
        success: true,
        schedules: schedules.map(withOccupiedSeats),
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        globalStats: {
          total,
          completed: completedCount,
          cancelled: cancelledCount,
          totalRevenue,
          totalPassengers,
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

      if (!Array.isArray(times) || times.length > 10) {
        res.status(400).json({
          success: false,
          message: "Maximum 10 créneaux horaires par requête",
        });
        return;
      }

      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          departure: true,
          destination: true,
        },
      });
      if (!route) {
        res.status(404).json({ success: false, message: "Route non trouvée" });
        return;
      }

      const start = parseLocalDate(startDate);
      const end = endOfLocalDay(parseLocalDate(endDate));
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

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
      const dateTimesToCheck: { date: Date; time: string; dayStart: Date; dayEnd: Date }[] = [];

      while (current <= end) {
        for (const time of times) {
          const [hours, minutes] = time.split(":").map(Number);
          const departure = new Date(current);
          departure.setHours(hours!, minutes!, 0, 0);

          const dayStart = new Date(current);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(current);
          dayEnd.setHours(23, 59, 59, 999);

          dateTimesToCheck.push({ date: new Date(current), time, dayStart, dayEnd });

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
            status: departure <= now ? "past" : "new",
          });
        }
        current.setDate(current.getDate() + 1);
      }

      if (dateTimesToCheck.length > 0) {
        const existingSchedules = await prisma.schedule.findMany({
          where: {
            routeId,
            OR: dateTimesToCheck.map(({ dayStart, dayEnd, time }) => ({
              date: { gte: dayStart, lt: dayEnd },
              time,
            })),
          },
          select: { date: true, time: true },
        });

        const existingSet = new Set(
          existingSchedules.map((s) => {
            const dateStr = toLocalDateString(new Date(s.date));
            return `${dateStr}-${s.time}`;
          }),
        );

        for (const item of preview) {
          if (item.status !== "past" && existingSet.has(item.id)) {
            item.status = "exists";
          }
        }
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
          id: route.id,
          departure: route.departure.name,
          destination: route.destination.name,
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
      const { items } = req.body as {
        items: {
          routeId: string;
          date: string;
          time: string;
          price: number;
          vehicle: string;
          seatConfig?: { totalSeats?: number } | null;
          seatTemplateId?: string | null;
        }[];
      };

      if (!items?.length) {
        res.status(400).json({
          success: false,
          message: "Aucun horaire à créer",
        });
        return;
      }

      if (items.length > 500) {
        res.status(400).json({
          success: false,
          message: "Maximum 500 horaires par requête",
        });
        return;
      }

      const now = new Date();
      const schedulesToCreate: Prisma.ScheduleCreateManyInput[] = [];
      const skipped: { date: string; time: string; reason: string }[] = [];

      for (const item of items) {
        const [hours, minutes] = item.time.split(":").map(Number);
        const departure = parseLocalDate(item.date);
        departure.setHours(hours!, minutes!, 0, 0);

        if (departure <= now) {
          skipped.push({ date: item.date, time: item.time, reason: "Départ dans le passé" });
          continue;
        }

        const dayStart = parseLocalDate(item.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = endOfLocalDay(parseLocalDate(item.date));
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await prisma.schedule.findFirst({
          where: {
            routeId: item.routeId,
            date: { gte: dayStart, lt: dayEnd },
            time: item.time,
          },
        });

        if (existing) {
          skipped.push({ date: item.date, time: item.time, reason: "Déjà existant" });
          continue;
        }

        const route = await prisma.route.findUnique({
          where: { id: item.routeId },
        });
        if (!route) {
          skipped.push({ date: item.date, time: item.time, reason: "Route introuvable" });
          continue;
        }

        const totalSeats = item.seatConfig?.totalSeats ?? 16;
        schedulesToCreate.push({
          routeId: item.routeId,
          date: new Date(item.date),
          time: item.time,
          vehicle: (item.vehicle as any) || "Crafter",
          totalSeats,
          availableSeats: totalSeats,
          price: item.price || route.price,
          status: "scheduled",
          seatConfig: item.seatConfig ?? undefined,
          seatTemplateId: item.seatTemplateId ?? undefined,
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

      await prisma.schedule.createMany({
        data: schedulesToCreate,
      });

      res.status(201).json({
        success: true,
        message: `${schedulesToCreate.length} horaire(s) créé(s) avec succès`,
        created: schedulesToCreate.length,
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
