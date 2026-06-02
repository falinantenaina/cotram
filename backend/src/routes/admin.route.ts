import express from "express";
import { Prisma } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { sendReservationConfirmation } from "../config/email.js";
import { authorize, protect } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import {
  endOfLocalDay,
  parseLocalDate,
  toLocalDateString,
} from "../utils/date.utils.js";

const router = express.Router();

function withOccupiedSeats(schedule: any) {
  return {
    ...schedule,
    occupiedSeats: (schedule.occupiedSeats ?? []).map(
      (s: { seatNumber: number }) => s.seatNumber,
    ),
  };
}

function flattenReservationSeats(reservation: any) {
  return {
    ...reservation,
    seats: (reservation.seats ?? []).map((s: { seatNumber: number }) => s.seatNumber),
  };
}

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
      prisma.reservation.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.user.count({ where: { role: "user" } }),
      prisma.route.count({ where: { isActive: true } }),
      prisma.reservation.findMany({
        where: {
          createdAt: { gte: firstDayOfMonth },
          paymentStatus: "paid",
        },
        select: { totalPrice: true },
      }),
      prisma.reservation.count({ where: { status: "pending" } }),
    ]);

    const monthlyRevenue = monthlyReservations.reduce(
      (sum: number, r: { totalPrice: number }) => sum + r.totalPrice,
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

      const schedules = await prisma.schedule.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { not: "cancelled" },
        },
        include: { route: true, occupiedSeats: true },
        orderBy: { time: "asc" },
      });

      const schedulesWithStats = await Promise.all(
        schedules.map(async (schedule: any) => {
          const reservations = await prisma.reservation.findMany({
            where: {
              scheduleId: schedule.id,
              status: { in: ["confirmed", "pending"] },
            },
            include: {
              user: { select: { name: true, email: true, phone: true } },
              seats: true,
            },
          });

          return {
            ...withOccupiedSeats(schedule),
            reservations: reservations.map(flattenReservationSeats),
            passengerCount: reservations.reduce(
              (sum: number, r: any) => sum + r.seats.length,
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
        (sum: number, r: any) => sum + r.seats.length,
        0,
      );
      const revenue = reservations
        .filter((r: any) => r.paymentStatus === "paid")
        .reduce((sum: number, r: any) => sum + r.totalPrice, 0);

      res.json({
        success: true,
        schedule,
        passengers: reservations.map((r: any) => ({
          reservationId: r.id,
          bookingReference: r.bookingReference,
          status: r.status,
          paymentStatus: r.paymentStatus,
          seats: r.seats.map((s: any) => s.seatNumber),
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

      if (!name || !scheduleId || !seats || seats.length === 0) {
        res.status(400).json({
          success: false,
          message: "Nom, horaire et sièges sont requis",
        });
        return;
      }

      let user = phone
        ? await prisma.user.findFirst({ where: { phone } })
        : null;
      if (!user) {
        const tempEmail = phone
          ? `walkin_${phone.replace(/\s/g, "")}@cotram.local`
          : `walkin_${Date.now()}@cotram.local`;
        user = await prisma.user.create({
          data: {
            name,
            email: tempEmail,
            phone: phone || null,
            role: "user",
            isEmailVerified: false,
          },
        });
      } else if (user.name !== name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }

      const bookingReference = `CTR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const reservation = await prisma.$transaction(async (tx: any) => {
        const lockedScheduleResults = await tx.$queryRaw`
          SELECT id, "totalSeats", "availableSeats", price
          FROM "Schedule"
          WHERE id = ${scheduleId}
          FOR UPDATE
        `;
        const lockedSchedule = (lockedScheduleResults as any[])[0];

        if (!lockedSchedule) {
          throw new Error("SCHEDULE_NOT_FOUND");
        }

        const occupiedSeats = await tx.occupiedSeat.findMany({
          where: {
            scheduleId,
            seatNumber: { in: seats },
          },
        });

        const unavailableSeats = occupiedSeats.map((s: any) => s.seatNumber);
        if (unavailableSeats.length > 0) {
          throw new Error(`SEATS_UNAVAILABLE:${JSON.stringify(unavailableSeats)}`);
        }

        const totalPrice = seats.length * (lockedSchedule as any).price;

        const res = await tx.reservation.create({
          data: {
            userId: user!.id,
            scheduleId,
            totalPrice,
            status: "confirmed",
            paymentStatus: "paid",
            bookingReference,
            expiresAt: null,
          },
        });

        await tx.reservationSeat.createMany({
          data: seats.map((seatNumber: number) => ({
            reservationId: res.id,
            seatNumber,
          })),
        });

        await tx.occupiedSeat.createMany({
          data: seats.map((seatNumber: number) => ({
            scheduleId,
            seatNumber,
          })),
        });

        await tx.schedule.update({
          where: { id: scheduleId },
          data: {
            availableSeats: { decrement: seats.length },
          },
        });

        return res;
      });

      const populatedReservation = await prisma.reservation.findUnique({
        where: { id: reservation.id },
        include: {
          schedule: {
            include: { route: true },
          },
          user: true,
          seats: true,
        },
      });

      if (user.email && !user.email.includes("@cotram.local")) {
        try {
          const route = populatedReservation!.schedule.route;
          await sendReservationConfirmation(
            user.email,
            user.name,
            reservation.bookingReference,
            {
              departure: route.departure,
              destination: route.destination,
              date: new Date(
                populatedReservation!.schedule.date,
              ).toLocaleDateString("fr-FR"),
              time: populatedReservation!.schedule.time,
              seats: seats,
              totalPrice: reservation.totalPrice,
            },
          );
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      res.status(201).json({
        success: true,
        reservation: flattenReservationSeats(populatedReservation),
        message: `Réservation créée avec succès — Référence: ${reservation.bookingReference}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "SCHEDULE_NOT_FOUND") {
          res.status(404).json({ success: false, message: "Horaire non trouvé" });
          return;
        }
        if (error.message.startsWith("SEATS_UNAVAILABLE:")) {
          const unavailableSeats = JSON.parse(error.message.substring("SEATS_UNAVAILABLE:".length));
          res.status(400).json({
            success: false,
            message: "Certains sièges sont déjà occupés",
            unavailableSeats,
          });
          return;
        }
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
    const where: any = {};
    if (status && status !== "all") where.status = status;

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

// ─── GET all schedules (main list — avec option historique) ──────────────────
router.get("/schedules", protect, authorize("admin"), async (req, res) => {
  try {
    const { includeHistory, routeId, status } = req.query;

    const where: any = {};

    if (!(includeHistory === "true")) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      where.date = { gte: sevenDaysAgo };
    }

    if (routeId) where.routeId = routeId;
    if (status && status !== "all") where.status = status;

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: { select: { departure: true, destination: true, duration: true, price: true } },
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

      let where: any = {
        OR: [
          { status: { in: ["completed", "cancelled"] } },
          { status: { in: ["scheduled", "in_progress"] }, date: { lt: now } },
        ],
      };

      if (status && status !== "all") {
        where = { status };
      }
      if (routeId) where.routeId = routeId;
      if (driverId) where.driverId = driverId;
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = parseLocalDate(String(from));
        if (to) where.date.lte = endOfLocalDay(parseLocalDate(String(to)));
      }

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const [schedules, total] = await Promise.all([
        prisma.schedule.findMany({
          where,
          include: {
            route: { select: { departure: true, destination: true, duration: true, price: true } },
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

      const globalWhere = { ...where };

      const aggResult = await prisma.schedule.aggregate({
        where: globalWhere,
        _sum: {
          totalSeats: true,
          availableSeats: true,
        },
      });

      const totalPassengers =
        (aggResult._sum.totalSeats ?? 0) -
        (aggResult._sum.availableSeats ?? 0);
      const totalRevenue = totalPassengers * (schedules[0]?.price ?? 0);

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

      const route = await prisma.route.findUnique({
        where: { id: routeId },
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

            const existing = await prisma.schedule.findFirst({
              where: {
                routeId,
                date: { gte: dayStart, lt: dayEnd },
                time,
              },
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
          id: route.id,
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
      const { items } = req.body as {
        items: {
          routeId: string;
          date: string;
          time: string;
          price: number;
          vehicle: string;
          seatConfig?: any | null;
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

        const existing = await prisma.schedule.findFirst({
          where: {
            routeId: item.routeId,
            date: { gte: dayStart, lt: dayEnd },
            time: item.time,
          },
        });

        if (existing) {
          skipped.push({
            date: item.date,
            time: item.time,
            reason: "Déjà existant",
          });
          continue;
        }

        const route = await prisma.route.findUnique({
          where: { id: item.routeId },
        });
        if (!route) {
          skipped.push({
            date: item.date,
            time: item.time,
            reason: "Route introuvable",
          });
          continue;
        }

        const totalSeats = item.seatConfig?.totalSeats ?? 16;
        schedulesToCreate.push({
          routeId: item.routeId,
          date: new Date(item.date),
          time: item.time,
          vehicle: item.vehicle || "Crafter",
          totalSeats,
          availableSeats: totalSeats,
          price: item.price,
          status: "scheduled",
          seatConfig: item.seatConfig ?? undefined,
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
