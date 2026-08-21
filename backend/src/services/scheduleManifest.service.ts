import prisma from "../lib/prisma.js";

export async function getTodaySchedulesWithPassengers() {
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

  const scheduleIds = schedules.map((s) => s.id);

  const allReservations = await prisma.reservation.findMany({
    where: {
      scheduleId: { in: scheduleIds },
      status: { in: ["confirmed", "pending"] },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      seats: true,
    },
  });

  const reservationsBySchedule = new Map<string, typeof allReservations>();
  for (const r of allReservations) {
    const list = reservationsBySchedule.get(r.scheduleId) ?? [];
    list.push(r);
    reservationsBySchedule.set(r.scheduleId, list);
  }

  return schedules.map((schedule) => {
    const reservations = reservationsBySchedule.get(schedule.id) ?? [];
    return {
      ...schedule,
      occupiedSeats: schedule.occupiedSeats.map((s) => s.seatNumber),
      reservations: reservations.map((r) => ({
        ...r,
        seats: r.seats.map((s) => s.seatNumber),
      })),
      passengerCount: reservations.reduce(
        (sum: number, r) => sum + r.seats.length,
        0,
      ),
    };
  });
}
