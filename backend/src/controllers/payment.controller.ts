import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { logError } from "../lib/logger.js";
import prisma from "../lib/prisma.js";
import { emitToStaffAndDrivers, emitToUser } from "../lib/socket.js";
import * as mvolaService from "../services/mvola.service.js";
import type { AuthRequest } from "../types/index.js";
import { endOfLocalDay, parseLocalDate } from "../utils/date.utils.js";
import {
  PHONE_INVALID_MESSAGE,
  PHONE_REGEX,
  normalizePhone,
} from "../utils/phone.utils.js";

const PAYMENT_HOLD_MS = 15 * 60 * 1000; // 15 min hold on seats

function mapMvolaStatus(raw: string): "pending" | "completed" | "failed" {
  const s = (raw || "").toLowerCase();
  if (s === "completed" || s === "success" || s === "successful")
    return "completed";
  if (
    s === "failed" ||
    s === "rejected" ||
    s === "cancelled" ||
    s === "canceled" ||
    s === "timeout" ||
    s === "expired"
  ) {
    return "failed";
  }
  return "pending";
}

function seatsFromArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.filter((n): n is number => typeof n === "number");
}

function genBookingReference(): string {
  return `CTR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

/**
 * Release seat holds for a payment that never produced a reservation.
 * Idempotent — skips if seats are already free or a reservation exists.
 */
async function releaseHeldSeats(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.reservationId) return; // reservation exists → handled elsewhere

  const seatNumbers = seatsFromArray(payment.seats);
  if (seatNumbers.length === 0) return;

  await prisma.$transaction([
    prisma.occupiedSeat.deleteMany({
      where: {
        scheduleId: payment.scheduleId,
        seatNumber: { in: seatNumbers },
      },
    }),
    prisma.schedule.update({
      where: { id: payment.scheduleId },
      data: { availableSeats: { increment: seatNumbers.length } },
    }),
  ]);
}

/**
 * On payment success: create the reservation (confirmed + paid).
 * Idempotent — if reservation already exists, just confirm it.
 */
async function fulfillPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  // Already fulfilled?
  if (payment.reservationId) {
    const existing = await prisma.reservation.findUnique({
      where: { id: payment.reservationId },
    });
    if (existing && existing.status !== "confirmed") {
      await prisma.reservation.update({
        where: { id: existing.id },
        data: { status: "confirmed", paymentStatus: "paid", expiresAt: null },
      });
    }
    return;
  }

  const seatNumbers = seatsFromArray(payment.seats);
  const bookingReference = genBookingReference();

  // Create reservation + seats. OccupiedSeats already exist from initiate.
  const reservation = await prisma.reservation.create({
    data: {
      userId: payment.userId,
      scheduleId: payment.scheduleId,
      totalPrice: payment.amount,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: payment.method,
      bookingReference,
      expiresAt: null,
    },
  });

  await prisma.reservationSeat.createMany({
    data: seatNumbers.map((seatNumber) => ({
      reservationId: reservation.id,
      seatNumber,
    })),
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { reservationId: reservation.id },
  });

  emitToUser(payment.userId, "reservation:created", {
    id: reservation.id,
    scheduleId: payment.scheduleId,
    seats: seatNumbers,
    totalPrice: payment.amount,
  });
  emitToStaffAndDrivers("reservation:created", {
    id: reservation.id,
    scheduleId: payment.scheduleId,
    seats: seatNumbers,
    totalPrice: payment.amount,
  });

  // Email (non-blocking)
  try {
    const full = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        schedule: {
          include: {
            route: { include: { departure: true, destination: true } },
          },
        },
        user: true,
        seats: true,
      },
    });
    if (full) {
      const { sendReservationConfirmation } =
        await import("../config/email.js");
      const route = full.schedule.route;
      await sendReservationConfirmation(
        full.user.email,
        full.user.name,
        full.bookingReference,
        {
          departure: route.departure.name,
          destination: route.destination.name,
          date: new Date(full.schedule.date).toLocaleDateString("fr-FR"),
          time: full.schedule.time,
          seats: full.seats.map((s) => s.seatNumber),
          totalPrice: full.totalPrice,
        },
      );
    }
  } catch (err) {
    logError("MVOLA_EMAIL", err);
  }
}

/**
 * On payment failure: release seat holds, create NO reservation.
 * Idempotent.
 */
async function failPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  // If a reservation was somehow created, cancel it
  if (payment.reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: payment.reservationId },
      include: { seats: true },
    });
    if (reservation && reservation.status !== "cancelled") {
      const seatNumbers = reservation.seats.map((s) => s.seatNumber);
      await prisma.$transaction([
        prisma.occupiedSeat.deleteMany({
          where: {
            scheduleId: reservation.scheduleId,
            seatNumber: { in: seatNumbers },
          },
        }),
        prisma.schedule.update({
          where: { id: reservation.scheduleId },
          data: { availableSeats: { increment: seatNumbers.length } },
        }),
        prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: "cancelled", paymentStatus: "pending" },
        }),
      ]);
      emitToUser(payment.userId, "reservation:cancelled", {
        id: reservation.id,
        scheduleId: reservation.scheduleId,
      });
    }
    return;
  }

  // No reservation — just release the seat holds
  await releaseHeldSeats(paymentId);
}

type PaymentRow = {
  id: string;
  status: string;
  serverCorrelationId: string | null;
  expiresAt: Date | null;
  reservationId: string | null;
  mvolaTransactionRef: string | null;
};

/**
 * Sync payment status from Mvola, fulfill/fail on transition.
 */
async function syncPaymentStatus<T extends PaymentRow>(payment: T): Promise<T> {
  if (payment.status !== "pending") return payment;
  if (!payment.serverCorrelationId) return payment;

  // Expiry check — fail + release holds, no reservation
  if (payment.expiresAt && payment.expiresAt < new Date()) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    await failPayment(payment.id);
    return { ...payment, ...updated } as T;
  }

  try {
    const mvolaStatus = await mvolaService.verifierStatut(
      payment.serverCorrelationId,
    );
    const mapped = mapMvolaStatus(mvolaStatus.status);

    if (mapped === "pending") return payment;

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mapped,
        mvolaTransactionRef: mvolaStatus.object_reference,
        mvolaResponse: mvolaStatus as object,
      },
    });

    if (mapped === "completed") {
      await fulfillPayment(payment.id);
    } else if (mapped === "failed") {
      await failPayment(payment.id);
    }

    return { ...payment, ...updated } as T;
  } catch (err) {
    logError("MVOLA_SYNC", err);
    return payment;
  }
}

//  POST /api/payments/initiate
// Body: { scheduleId, seats, phone, method? }
// Holds seats, initiates Mvola. NO reservation created yet.
export const initiatePayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let heldSeats = false;
  let heldScheduleId = "";
  let heldSeatNumbers: number[] = [];

  try {
    const { user } = req as AuthRequest;
    const { scheduleId, seats, phone, method } = req.body as {
      scheduleId?: string;
      seats?: number[];
      phone?: string;
      method?: string;
    };

    if (!scheduleId || !seats || !Array.isArray(seats) || seats.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "scheduleId et seats sont requis" });
      return;
    }
    if (!phone || !PHONE_REGEX.test(normalizePhone(phone))) {
      res.status(400).json({
        success: false,
        message: PHONE_INVALID_MESSAGE,
      });
      return;
    }

    const cleanPhone = normalizePhone(phone);
    const seatNumbers = seats.filter((n) => Number.isInteger(n) && n > 0);

    // Check for existing pending payment for this user+schedule (idempotent retry)
    const existing = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        scheduleId,
        status: "pending",
        reservationId: null,
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing && existing.serverCorrelationId) {
      const synced = await syncPaymentStatus(existing);
      res.json({
        success: true,
        paymentId: synced.id,
        status: synced.status,
        serverCorrelationId: synced.serverCorrelationId,
        reservationId: synced.reservationId ?? null,
        existing: true,
      });
      return;
    }

    // Load schedule + price
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, price: true, availableSeats: true },
    });
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }

    const amount = seatNumbers.length * schedule.price;

    // Hold seats in a transaction (before calling Mvola)
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, "availableSeats" FROM "schedules" WHERE id = ${scheduleId} FOR UPDATE
      `;
      const row = (locked as { availableSeats: number }[])[0];
      if (!row) throw new Error("SCHEDULE_NOT_FOUND");
      if (row.availableSeats < seatNumbers.length) {
        throw new Error("SEATS_UNAVAILABLE");
      }

      const occupied = await tx.occupiedSeat.findMany({
        where: { scheduleId, seatNumber: { in: seatNumbers } },
      });
      if (occupied.length > 0) throw new Error("SEATS_UNAVAILABLE");

      await tx.occupiedSeat.createMany({
        data: seatNumbers.map((seatNumber) => ({ scheduleId, seatNumber })),
      });
      await tx.schedule.update({
        where: { id: scheduleId },
        data: { availableSeats: { decrement: seatNumbers.length } },
      });
    });
    heldSeats = true;
    heldScheduleId = scheduleId;
    heldSeatNumbers = seatNumbers;

    // Create payment record (no reservation yet)
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        scheduleId,
        seats: seatNumbers,
        phone: cleanPhone,
        amount,
        method: method || "mvola",
        status: "pending",
        expiresAt: new Date(Date.now() + PAYMENT_HOLD_MS),
        metadata: { userId: user.id, seatCount: seatNumbers.length },
      },
    });

    // Initiate Mvola
    try {
      const callbackURL = process.env.MVOLA_CALLBACK_URL || undefined;
      const mvolaResult = await mvolaService.initierPaiement({
        telephone_client: cleanPhone,
        montant: amount,
        description: `COTRAM ${payment.id.slice(-8)}`,
        reference_client: payment.id.slice(0, 50),
        callbackURL,
        metadata: [
          { key: "paymentId", value: payment.id },
          { key: "userId", value: user.id },
        ],
      });

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          serverCorrelationId: mvolaResult.server_correlation_id,
          mvolaResponse: mvolaResult as object,
        },
      });

      res.status(201).json({
        success: true,
        paymentId: updated.id,
        status: updated.status,
        serverCorrelationId: mvolaResult.server_correlation_id,
        reservationId: null,
      });
    } catch (mvolaErr) {
      // Mvola failed → release holds, mark payment failed, NO reservation
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
      await releaseHeldSeats(payment.id);
      heldSeats = false;
      throw mvolaErr;
    }
  } catch (err) {
    // Safety: if we held seats but didn't create a payment link, release
    if (heldSeats && heldSeatNumbers.length > 0) {
      try {
        await prisma.$transaction([
          prisma.occupiedSeat.deleteMany({
            where: {
              scheduleId: heldScheduleId,
              seatNumber: { in: heldSeatNumbers },
            },
          }),
          prisma.schedule.update({
            where: { id: heldScheduleId },
            data: { availableSeats: { increment: heldSeatNumbers.length } },
          }),
        ]);
      } catch {
        // best effort
      }
    }

    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de l'initiation du paiement";
    res.status(500).json({ success: false, message });
  }
};

//  GET /api/payments/:id/status
export const getPaymentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const paymentId = String(req.params["id"]);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.userId !== user.id) {
      res.status(404).json({ success: false, message: "Paiement non trouvé" });
      return;
    }

    const synced = await syncPaymentStatus(payment);

    res.json({
      success: true,
      paymentId: synced.id,
      status: synced.status,
      serverCorrelationId: synced.serverCorrelationId,
      mvolaTransactionRef: synced.mvolaTransactionRef,
      reservationId: synced.reservationId ?? null,
    });
  } catch (err) {
    logError("PAYMENT_STATUS", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

//  GET /api/payments/:id
export const getPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const payment = await prisma.payment.findUnique({
      where: { id: String(req.params["id"]) },
      include: { reservation: true },
    });
    if (!payment || payment.userId !== user.id) {
      res.status(404).json({ success: false, message: "Paiement non trouvé" });
      return;
    }
    res.json({ success: true, payment });
  } catch (err) {
    logError("PAYMENT_GET", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

//  GET /api/payments/history
// User's own mobile-money payments (mvola + orange_money), all statuses incl. failed
export const getMyPaymentHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const { page = 1, limit = 20, status, method, from, to } = req.query;

    const where: Prisma.PaymentWhereInput = {
      userId: user.id,
      method: { in: ["mvola", "orange_money"] },
    };

    if (status && status !== "all") {
      where.status = status as "pending" | "completed" | "failed";
    }
    if (method && method !== "all") {
      where.method = String(method);
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = parseLocalDate(String(from));
      if (to) where.createdAt.lte = endOfLocalDay(parseLocalDate(String(to)));
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);

    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          reservation: { select: { id: true, bookingReference: true } },
          schedule: {
            select: {
              id: true,
              date: true,
              time: true,
              route: {
                select: {
                  departure: { select: { name: true } },
                  destination: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["status"],
        where: {
          userId: user.id,
          method: { in: ["mvola", "orange_money"] },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const statsByStatus = Object.fromEntries(
      stats.map((s) => [
        s.status,
        { count: s._count._all, totalAmount: s._sum.amount ?? 0 },
      ]),
    );

    res.json({
      success: true,
      payments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      stats: {
        completed: statsByStatus["completed"] ?? { count: 0, totalAmount: 0 },
        failed: statsByStatus["failed"] ?? { count: 0, totalAmount: 0 },
        pending: statsByStatus["pending"] ?? { count: 0, totalAmount: 0 },
      },
    });
  } catch (err) {
    logError("PAYMENT_HISTORY", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

//  GET /api/payments/admin/history
// Admin + caissier: only SUCCESSFUL (completed) payments, with user/schedule info
export const getAdminPaymentHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page = 1, limit = 25, method, search, from, to } = req.query;

    const where: Prisma.PaymentWhereInput = {
      status: "completed",
      method: { in: ["mvola", "orange_money"] },
    };

    if (method && method !== "all") {
      where.method = String(method);
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = parseLocalDate(String(from));
      if (to) where.createdAt.lte = endOfLocalDay(parseLocalDate(String(to)));
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { phone: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        {
          reservation: {
            bookingReference: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 25), 100);

    const [payments, total, methodAgg, globalAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          reservation: { select: { id: true, bookingReference: true } },
          schedule: {
            select: {
              id: true,
              date: true,
              time: true,
              route: {
                select: {
                  departure: { select: { name: true } },
                  destination: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          status: "completed",
          method: { in: ["mvola", "orange_money"] },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "completed",
          method: { in: ["mvola", "orange_money"] },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const byMethod = Object.fromEntries(
      methodAgg.map((m) => [
        m.method,
        { count: m._count._all, totalAmount: m._sum.amount ?? 0 },
      ]),
    );

    res.json({
      success: true,
      payments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      stats: {
        totalPayments: globalAgg._count._all,
        totalAmount: globalAgg._sum.amount ?? 0,
        mvola: byMethod["mvola"] ?? { count: 0, totalAmount: 0 },
        orangeMoney: byMethod["orange_money"] ?? { count: 0, totalAmount: 0 },
      },
    });
  } catch (err) {
    logError("PAYMENT_ADMIN_HISTORY", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

//  POST /api/payments/callback
export const mvolaCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as {
      serverCorrelationId?: string;
      status?: string;
      objectReference?: string;
    };

    if (!body.serverCorrelationId) {
      res
        .status(400)
        .json({ success: false, message: "serverCorrelationId manquant" });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { serverCorrelationId: body.serverCorrelationId },
    });

    if (!payment) {
      res
        .status(200)
        .json({ success: true, message: "Paiement inconnu — ignoré" });
      return;
    }

    const mapped = mapMvolaStatus(body.status || "");

    if (mapped === "pending") {
      res.json({ success: true, status: "pending" });
      return;
    }

    if (payment.status !== "pending") {
      res.json({
        success: true,
        status: payment.status,
        alreadyProcessed: true,
      });
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mapped,
        mvolaTransactionRef:
          body.objectReference || payment.mvolaTransactionRef,
        mvolaResponse: body as object,
      },
    });

    if (mapped === "completed") {
      await fulfillPayment(payment.id);
    } else if (mapped === "failed") {
      await failPayment(payment.id);
    }

    res.json({ success: true, status: mapped });
  } catch (err) {
    logError("MVOLA_CALLBACK", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
