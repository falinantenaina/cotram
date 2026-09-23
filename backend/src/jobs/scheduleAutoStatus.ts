import prisma from "../lib/prisma.js";
import { parseDurationToMinutes } from "../utils/date.utils.js";

let isRunning = false;

/**
 * Démarre le job automatique de mise à jour des statuts.
 * - "scheduled" → "in_progress" quand l'heure de départ est arrivée
 * - "in_progress" → "completed" quand la durée du trajet est écoulée
 * - Libère les places des réservations expirées (pending + expiresAt < now)
 * - Échoue les paiements expirés (pending + expiresAt < now) et libère les sièges
 */
export function startScheduleAutoStatusJob() {
  console.log("⏰ [AutoStatus] Job de statut automatique démarré");

  const run = async () => {
    if (isRunning) {
      console.log("⏳ [AutoStatus] Job déjà en cours, skip");
      return;
    }
    isRunning = true;

    try {
      const now = new Date();

      const scheduled = await prisma.schedule.findMany({
        where: { status: "scheduled" },
        take: 500,
      });

      for (const trip of scheduled) {
        const [h, m] = trip.time.split(":").map(Number);
        const departure = new Date(trip.date);
        departure.setHours(h!, m!, 0, 0);

        if (departure <= now) {
          await prisma.schedule.update({
            where: { id: trip.id },
            data: { status: "in_progress" },
          });
          console.log(
            `✅ [AutoStatus] ${trip.id} : scheduled → in_progress (${trip.time})`,
          );
        }
      }

      const inProgress = await prisma.schedule.findMany({
        where: { status: "in_progress" },
        include: { route: { select: { duration: true } } },
        take: 500,
      });

      for (const trip of inProgress) {
        const [h, m] = trip.time.split(":").map(Number);
        const departure = new Date(trip.date);
        departure.setHours(h!, m!, 0, 0);

        const durationMins = parseDurationToMinutes(
          trip.route?.duration ?? "2h",
        );
        const expectedArrival = new Date(
          departure.getTime() + durationMins * 60_000,
        );

        if (now >= expectedArrival) {
          await prisma.schedule.update({
            where: { id: trip.id },
            data: { status: "completed" },
          });
          console.log(`✅ [AutoStatus] ${trip.id} : in_progress → completed`);
        }
      }

      // 1. Expire pending reservations (cash holds) — release seats
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: "pending",
          expiresAt: { lt: now },
        },
        include: { seats: true },
        take: 500,
      });

      for (const reservation of expiredReservations) {
        try {
          await prisma.$transaction(async (tx) => {
            const seatNumbers = reservation.seats.map((s) => s.seatNumber);

            await tx.occupiedSeat.deleteMany({
              where: {
                scheduleId: reservation.scheduleId,
                seatNumber: { in: seatNumbers },
              },
            });

            await tx.schedule.update({
              where: { id: reservation.scheduleId },
              data: {
                availableSeats: { increment: seatNumbers.length },
              },
            });

            await tx.reservation.update({
              where: { id: reservation.id },
              data: {
                status: "cancelled",
                paymentStatus: "pending",
              },
            });
          });
          console.log(
            `🕐 [AutoStatus] Réservation expirée libérée: ${reservation.bookingReference} (${reservation.seats.length} siège(s))`,
          );
        } catch (err) {
          console.error(`❌ [AutoStatus] Erreur libération réservation ${reservation.id}:`, err);
        }
      }

      // 2. Expire pending payments (Mvola holds) — fail + release seats, NO reservation
      const expiredPayments = await prisma.payment.findMany({
        where: {
          status: "pending",
          expiresAt: { lt: now },
        },
        take: 500,
      });

      for (const payment of expiredPayments) {
        try {
          // Skip if a reservation was already created (shouldn't happen for expired pending)
          if (payment.reservationId) continue;

          const seatNumbers = Array.isArray(payment.seats)
            ? (payment.seats as number[]).filter((n) => typeof n === "number")
            : [];

          await prisma.$transaction(async (tx) => {
            if (seatNumbers.length > 0) {
              await tx.occupiedSeat.deleteMany({
                where: {
                  scheduleId: payment.scheduleId,
                  seatNumber: { in: seatNumbers },
                },
              });
              await tx.schedule.update({
                where: { id: payment.scheduleId },
                data: { availableSeats: { increment: seatNumbers.length } },
              });
            }
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "failed" },
            });
          });
          console.log(
            `🕐 [AutoStatus] Paiement expiré échoué: ${payment.id} (${seatNumbers.length} siège(s) libéré(s)) — aucune réservation créée`,
          );
        } catch (err) {
          console.error(`❌ [AutoStatus] Erreur expiration paiement ${payment.id}:`, err);
        }
      }
    } catch (err) {
      console.error("❌ [AutoStatus] Erreur:", err);
    } finally {
      isRunning = false;
    }
  };

  run();
  const interval = setInterval(run, 300 * 1000);
  return interval;
}
