import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendReservationConfirmation } from "../config/email.js";
import prisma from "../lib/prisma.js";
import type { AuthRequest } from "../types/index.js";

function flattenSeats(reservation: any) {
  return {
    ...reservation,
    seats: (reservation.seats ?? []).map((s: { seatNumber: number }) => s.seatNumber),
    schedule: reservation.schedule
      ? {
          ...reservation.schedule,
          occupiedSeats: (reservation.schedule.occupiedSeats ?? []).map(
            (s: { seatNumber: number }) => s.seatNumber,
          ),
        }
      : undefined,
  };
}

export const getReservations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const reservations = await prisma.reservation.findMany({
      where: { userId: user.id },
      include: {
        schedule: {
          include: { route: true, occupiedSeats: true },
        },
        seats: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, reservations: reservations.map(flattenSeats) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: String(req.params["id"]),
        userId: user.id,
      },
      include: {
        schedule: {
          include: { route: true, occupiedSeats: true },
        },
        seats: true,
      },
    });

    if (!reservation) {
      res
        .status(404)
        .json({ success: false, message: "Réservation non trouvée" });
      return;
    }

    res.json({ success: true, reservation: flattenSeats(reservation) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const cancelReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: String(req.params["id"]),
        userId: user.id,
      },
      include: {
        schedule: true,
        seats: true,
      },
    });

    if (!reservation) {
      res
        .status(404)
        .json({ success: false, message: "Réservation non trouvée" });
      return;
    }
    if (reservation.status === "cancelled") {
      res
        .status(400)
        .json({
          success: false,
          message: "Cette réservation est déjà annulée",
        });
      return;
    }
    if (reservation.status === "completed") {
      res
        .status(400)
        .json({
          success: false,
          message: "Impossible d'annuler une réservation complétée",
        });
      return;
    }

    const seatNumbers = reservation.seats.map((s: { seatNumber: number }) => s.seatNumber);

    await prisma.$transaction([
      prisma.occupiedSeat.deleteMany({
        where: {
          scheduleId: reservation.scheduleId,
          seatNumber: { in: seatNumbers },
        },
      }),
      prisma.schedule.update({
        where: { id: reservation.scheduleId },
        data: {
          availableSeats: { increment: seatNumbers.length },
        },
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "cancelled",
          paymentStatus: reservation.paymentStatus === "paid" ? "refunded" : reservation.paymentStatus,
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Réservation annulée avec succès",
      reservation: { ...flattenSeats(reservation), status: "cancelled" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const { scheduleId, seats } = req.body;

    if (!scheduleId || !seats || seats.length === 0) {
      res.status(400).json({ success: false, message: "scheduleId et seats sont requis" });
      return;
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true },
    });
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }

    const bookingReference = `CTR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const reservation = await prisma.$transaction(async (tx) => {
      const lockedScheduleResults = await tx.$queryRaw`
        SELECT id, "totalSeats", "availableSeats", price
        FROM "schedules"
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

      const unavailableSeats = occupiedSeats.map((s: { seatNumber: number }) => s.seatNumber);
      if (unavailableSeats.length > 0) {
        throw new Error(`SEATS_UNAVAILABLE:${JSON.stringify(unavailableSeats)}`);
      }

      const totalPrice = seats.length * (lockedSchedule as any).price;

      const res = await tx.reservation.create({
        data: {
          userId: user.id,
          scheduleId,
          totalPrice,
          bookingReference,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
          include: { route: true, occupiedSeats: true },
        },
        seats: true,
      },
    });

    res.status(201).json({ success: true, reservation: flattenSeats(populatedReservation) });
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
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const confirmReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: String(req.params["id"]) },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                departure: true,
                destination: true,
              },
            },
            occupiedSeats: true,
          },
        },
        user: true,
        seats: true,
      },
    });

    if (!reservation) {
      res
        .status(404)
        .json({ success: false, message: "Réservation non trouvée" });
      return;
    }

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "confirmed",
        paymentStatus: "paid",
        expiresAt: null,
      },
    });

    try {
      const route = reservation.schedule.route;
      await sendReservationConfirmation(
        reservation.user.email,
        reservation.user.name,
        reservation.bookingReference,
        {
          departure: route.departure.name,
          destination: route.destination.name,
          date: new Date(reservation.schedule.date).toLocaleDateString("fr-FR"),
          time: reservation.schedule.time,
          seats: reservation.seats.map((s: { seatNumber: number }) => s.seatNumber),
          totalPrice: reservation.totalPrice,
        },
      );
    } catch (error) {
      console.error("Erreur envoi email confirmation:", error);
    }

    res.json({ success: true, reservation: flattenSeats(reservation) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
