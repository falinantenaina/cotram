import Schedule from "../models/schedule.model.js";

/**
 * Convertit une durée texte ("2h30", "1h", "45min", "2h 30min") en minutes
 */
function parseDurationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)\s*h/);
  const minutesMatch = duration.match(/(\d+)\s*min/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]!) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]!) : 0;
  // Si aucun match (ex: "2h30" sans espace) tenter parse direct
  if (hours === 0 && minutes === 0) {
    const direct = parseInt(duration);
    if (!isNaN(direct)) return direct;
    return 120; // fallback 2h
  }
  return hours * 60 + minutes;
}

/**
 * Démarre le job automatique de mise à jour des statuts.
 * - "scheduled" → "in_progress" quand l'heure de départ est arrivée
 * - "in_progress" → "completed" quand la durée du trajet est écoulée
 *
 * Appeler cette fonction une fois après mongoose.connect()
 */
export function startScheduleAutoStatusJob() {
  console.log("⏰ [AutoStatus] Job de statut automatique démarré");

  const run = async () => {
    try {
      const now = new Date();

      // Passer "scheduled" → "in_progress"
      const scheduled = await Schedule.find({ status: "scheduled" });

      for (const trip of scheduled) {
        const [h, m] = trip.time.split(":").map(Number);
        const departure = new Date(trip.date);
        departure.setHours(h!, m!, 0, 0);

        if (departure <= now) {
          await Schedule.findByIdAndUpdate(trip._id, { status: "in_progress" });
          console.log(
            `✅ [AutoStatus] ${trip._id} : scheduled → in_progress (${trip.time})`,
          );
        }
      }

      // ── Passer "in_progress" → "completed"
      const inProgress = await Schedule.find({
        status: "in_progress",
      }).populate<{
        route: { duration: string };
      }>("route", "duration");

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
          await Schedule.findByIdAndUpdate(trip._id, { status: "completed" });
          console.log(`✅ [AutoStatus] ${trip._id} : in_progress → completed`);
        }
      }
    } catch (err) {
      console.error("❌ [AutoStatus] Erreur:", err);
    }
  };

  // Lancer immédiatement au démarrage, puis toutes les minutes
  run();
  const interval = setInterval(run, 300 * 1000);
  return interval; // retourné pour pouvoir clearInterval si besoin
}
