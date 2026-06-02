import prisma from "../lib/prisma.js";
import { parseDurationToMinutes } from "../utils/date.utils.js";

/**
 * Démarre le job automatique de mise à jour des statuts.
 * - "scheduled" → "in_progress" quand l'heure de départ est arrivée
 * - "in_progress" → "completed" quand la durée du trajet est écoulée
 */
export function startScheduleAutoStatusJob() {
  console.log("⏰ [AutoStatus] Job de statut automatique démarré");

  const run = async () => {
    try {
      const now = new Date();

      const scheduled = await prisma.schedule.findMany({
        where: { status: "scheduled" },
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
    } catch (err) {
      console.error("❌ [AutoStatus] Erreur:", err);
    }
  };

  run();
  const interval = setInterval(run, 300 * 1000);
  return interval;
}
