import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

export async function getDashboardStats() {
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

  return { todayReservations, totalUsers, activeRoutes, monthlyRevenue, pendingCount };
}
