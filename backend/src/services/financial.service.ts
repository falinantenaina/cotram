import prisma from "../lib/prisma.js";
import { parseLocalDate, endOfLocalDay, toLocalDateString } from "../utils/date.utils.js";

export type FinancePeriod = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

function getDateRange(period: FinancePeriod, from?: string, to?: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      return { start: todayStart, end: endOfLocalDay(todayStart) };

    case "yesterday": {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      return { start: y, end: endOfLocalDay(y) };
    }

    case "week": {
      const w = new Date(todayStart);
      w.setDate(w.getDate() - 7);
      return { start: w, end: endOfLocalDay(todayStart) };
    }

    case "month": {
      const m = new Date(todayStart);
      m.setDate(m.getDate() - 30);
      return { start: m, end: endOfLocalDay(todayStart) };
    }

    case "quarter": {
      const q = new Date(todayStart);
      q.setDate(q.getDate() - 90);
      return { start: q, end: endOfLocalDay(todayStart) };
    }

    case "year": {
      const y = new Date(todayStart);
      y.setFullYear(y.getFullYear() - 1);
      return { start: y, end: endOfLocalDay(todayStart) };
    }

    case "custom": {
      const start = from ? parseLocalDate(from) : todayStart;
      const end = to ? endOfLocalDay(parseLocalDate(to)) : endOfLocalDay(todayStart);
      return { start, end };
    }

    default:
      return { start: todayStart, end: endOfLocalDay(todayStart) };
  }
}

export async function getFinanceOverview(period: FinancePeriod, from?: string, to?: string) {
  const { start, end } = getDateRange(period, from, to);

  const [revenueResult, countResult, seatResult] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: start, lte: end },
      },
      select: { totalPrice: true },
    }),
    prisma.reservation.count({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: start, lte: end },
      },
    }),
    prisma.schedule.aggregate({
      where: {
        date: { gte: start, lte: end },
        status: { in: ["completed", "scheduled", "in_progress"] },
      },
      _sum: { totalSeats: true, availableSeats: true },
    }),
  ]);

  const totalRevenue = revenueResult.reduce((sum: number, r: { totalPrice: number }) => sum + r.totalPrice, 0);
  const avgTicket = countResult > 0 ? totalRevenue / countResult : 0;
  const totalSeats = seatResult._sum.totalSeats ?? 0;
  const availableSeats = seatResult._sum.availableSeats ?? 0;
  const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

  const cancelledCount = await prisma.reservation.count({
    where: {
      status: "cancelled",
      createdAt: { gte: start, lte: end },
    },
  });

  return {
    totalRevenue,
    paidReservations: countResult,
    avgTicket: Math.round(avgTicket),
    occupancyRate,
    cancelledReservations: cancelledCount,
    period: { from: toLocalDateString(start), to: toLocalDateString(end) },
  };
}

export async function getRevenueByPeriod(period: FinancePeriod, from?: string, to?: string) {
  const { start, end } = getDateRange(period, from, to);

  const reservations = await prisma.reservation.findMany({
    where: {
      paymentStatus: "paid",
      createdAt: { gte: start, lte: end },
    },
    select: { totalPrice: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, { revenue: number; count: number }> = {};

  for (const r of reservations) {
    const key = toLocalDateString(r.createdAt);
    if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
    grouped[key].revenue += r.totalPrice;
    grouped[key].count += 1;
  }

  const days: { date: string; revenue: number; reservations: number }[] = [];
  const current = new Date(start);
  while (current <= end) {
    const key = toLocalDateString(current);
    days.push({
      date: key,
      revenue: grouped[key]?.revenue ?? 0,
      reservations: grouped[key]?.count ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export async function getRevenueByRoute(from?: string, to?: string) {
  const { start, end } = getDateRange("custom", from, to);

  const reservations = await prisma.reservation.findMany({
    where: {
      paymentStatus: "paid",
      createdAt: { gte: start, lte: end },
    },
    select: {
      totalPrice: true,
      schedule: {
        select: {
          route: {
            select: {
              departure: { select: { name: true } },
              destination: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const grouped: Record<string, { route: string; revenue: number; count: number }> = {};

  for (const r of reservations) {
    const departure = r.schedule.route.departure.name;
    const destination = r.schedule.route.destination.name;
    const key = `${departure} → ${destination}`;
    if (!grouped[key]) grouped[key] = { route: key, revenue: 0, count: 0 };
    grouped[key].revenue += r.totalPrice;
    grouped[key].count += 1;
  }

  return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
}

export async function getDailyReport(dateStr: string) {
  const dayStart = parseLocalDate(dateStr);
  const dayEnd = endOfLocalDay(dayStart);

  const [schedules, reservations] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        route: {
          include: { departure: true, destination: true },
        },
        driver: { select: { firstName: true, lastName: true } },
        occupiedSeats: true,
      },
      orderBy: { time: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        seats: { select: { seatNumber: true } },
      },
    }),
  ]);

  const totalRevenue = reservations
    .filter((r: { paymentStatus: string }) => r.paymentStatus === "paid")
    .reduce((sum: number, r: { totalPrice: number }) => sum + r.totalPrice, 0);

  const totalPassengers = reservations.reduce((sum: number, r: { seats: { seatNumber: number }[] }) => sum + r.seats.length, 0);
  const confirmedCount = reservations.filter((r: { status: string }) => r.status === "confirmed").length;
  const pendingCount = reservations.filter((r: { status: string }) => r.status === "pending").length;
  const cancelledCount = reservations.filter((r: { status: string }) => r.status === "cancelled").length;

  const scheduleDetails = schedules.map((s: any) => {
    const occupied = s.occupiedSeats.length;
    const routeLabel = `${s.route.departure.name} → ${s.route.destination.name}`;
    const scheduleReservations = reservations.filter(
      (r: { status: string }) => r.status !== "cancelled",
    );
    const scheduleRevenue = scheduleReservations
      .filter((r: { paymentStatus: string }) => r.paymentStatus === "paid")
      .reduce((sum: number, r: { totalPrice: number }) => sum + r.totalPrice, 0);

    return {
      id: s.id,
      time: s.time,
      route: routeLabel,
      driver: s.driver ? `${s.driver.firstName} ${s.driver.lastName}` : "—",
      vehicle: s.vehicle,
      totalSeats: s.totalSeats,
      occupied,
      occupancyRate: s.totalSeats > 0 ? Math.round((occupied / s.totalSeats) * 100) : 0,
      status: s.status,
      revenue: scheduleRevenue,
    };
  });

  return {
    date: dateStr,
    summary: {
      totalSchedules: schedules.length,
      totalRevenue,
      totalPassengers,
      confirmedReservations: confirmedCount,
      pendingReservations: pendingCount,
      cancelledReservations: cancelledCount,
    },
    schedules: scheduleDetails,
  };
}
