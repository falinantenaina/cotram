/**
 * Parse une date "YYYY-MM-DD" en heure locale (minuit local)
 * et non en UTC midnight (comportement par défaut de new Date("YYYY-MM-DD"))
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!, 0, 0, 0, 0);
}

/**
 * Retourne le début du jour en heure locale (00:00:00.000)
 */
export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retourne la fin du jour en heure locale (23:59:59.999)
 */
export function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Formate une Date en "YYYY-MM-DD" en heure locale
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse une durée texte ("2h30", "1h", "45min", "2h 30min") en minutes
 */
export function parseDurationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)\s*h/);
  const minutesMatch = duration.match(/(\d+)\s*min/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]!) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]!) : 0;
  if (hours === 0 && minutes === 0) {
    const direct = parseInt(duration);
    if (!isNaN(direct)) return direct;
    return 120;
  }
  return hours * 60 + minutes;
}

/**
 * Vérifie si deux plages horaires se chevauchent sur la même journee
 */
export function hasTimeOverlap(
  start1Minutes: number,
  end1Minutes: number,
  start2Minutes: number,
  end2Minutes: number,
): boolean {
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}
