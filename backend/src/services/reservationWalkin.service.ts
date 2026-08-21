import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { sendReservationConfirmation } from "../config/email.js";

export class WalkinError extends Error {
  constructor(message: string, public statusCode: number, public unavailableSeats?: number[]) {
    super(message);
  }
}

export async function createWalkinReservation(data: {
  name: string;
  phone?: string;
  scheduleId: string;
  seats: number[];
  performedBy?: string;
}) {
  const { name, phone, scheduleId, seats, performedBy = "admin" } = data;

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

  const bookingReference = `CTR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const reservation = await prisma.$transaction(async (tx) => {
    const lockedScheduleResults = await tx.$queryRaw`
      SELECT id, "totalSeats", "availableSeats", price
      FROM "schedules"
      WHERE id = ${scheduleId}
      FOR UPDATE
    `;
    const lockedSchedule = (lockedScheduleResults as Array<{ id: string; totalSeats: number; availableSeats: number; price: number }>)[0];

    if (!lockedSchedule) {
      throw new WalkinError("Horaire non trouvé", 404);
    }

    const occupiedSeats = await tx.occupiedSeat.findMany({
      where: {
        scheduleId,
        seatNumber: { in: seats },
      },
    });

    const unavailableSeats = occupiedSeats.map((s) => s.seatNumber);
    if (unavailableSeats.length > 0) {
      const err = new WalkinError("Certains sièges sont déjà occupés", 400, unavailableSeats);
      throw err;
    }

    const totalPrice = seats.length * lockedSchedule.price;

    const createdReservation = await tx.reservation.create({
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
        reservationId: createdReservation.id,
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

    await tx.scheduleHistory.create({
      data: {
        scheduleId,
        action: "walkin_reservation",
        performedBy,
        details: `Réservation walk-in pour ${name} (${seats.length} siège(s))`,
      },
    });

    return createdReservation;
  });

  const populatedReservation = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    include: {
      schedule: {
        include: { route: { include: { departure: true, destination: true } } },
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
          departure: route.departure.name,
          destination: route.destination.name,
          date: new Date(populatedReservation!.schedule.date).toLocaleDateString("fr-FR"),
          time: populatedReservation!.schedule.time,
          seats,
          totalPrice: reservation.totalPrice,
        },
      );
    } catch (e) {
      console.error("Email error:", e);
    }
  }

  return populatedReservation;
}
