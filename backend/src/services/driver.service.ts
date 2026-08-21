import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export async function getDriverProfile(userId: string) {
  return prisma.driver.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
    },
  });
}

export async function getDriverTrips(driverId: string, filter?: string) {
  const now = new Date();

  const where: Prisma.ScheduleWhereInput = { driverId };

  if (filter === "upcoming") {
    Object.assign(where, { status: "scheduled", date: { gte: now } });
  } else if (filter === "completed") {
    Object.assign(where, { status: "completed" });
  } else if (filter === "cancelled") {
    Object.assign(where, { status: "cancelled" });
  }

  return prisma.schedule.findMany({
    where,
    include: {
      route: {
        include: { departure: true, destination: true },
      },
      _count: {
        select: {
          reservations: { where: { status: { not: "cancelled" } } },
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function getDriverSelfStats(driverId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, completed, cancelled, upcoming, thisMonth] = await Promise.all([
    prisma.schedule.count({ where: { driverId } }),
    prisma.schedule.count({ where: { driverId, status: "completed" } }),
    prisma.schedule.count({ where: { driverId, status: "cancelled" } }),
    prisma.schedule.count({ where: { driverId, status: "scheduled", date: { gte: now } } }),
    prisma.schedule.count({ where: { driverId, status: "completed", date: { gte: startOfMonth } } }),
  ]);

  return { total, completed, cancelled, upcoming, thisMonth };
}

export async function listDrivers(filters: { status?: string; search?: string }) {
  const where: Prisma.DriverWhereInput = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumDriverStatusFilter["equals"];
  }
  if (filters.search) {
    const q = filters.search;
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { licenseNumber: { contains: q, mode: "insensitive" } },
      { vehicleNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.driver.findMany({
    where,
    orderBy: { lastName: "asc" },
  });
}

export async function getDriverWithHistory(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return null;

  const schedules = await prisma.schedule.findMany({
    where: { driverId: driver.id },
    include: {
      route: {
        include: {
          departure: true,
          destination: true,
        },
        select: { duration: true, price: true },
      },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  return { driver, schedules };
}

export async function createDriver(data: {
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber?: string;
  vehicleType?: string;
  status?: string;
}) {
  return prisma.driver.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      vehicleNumber: data.vehicleNumber || null,
      vehicleType: (data.vehicleType as any) || "Crafter",
      status: (data.status as any) || "available",
    },
  });
}

export async function updateDriver(id: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  licenseNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  status?: string;
}) {
  const updateData: Record<string, unknown> = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
  if (data.vehicleNumber !== undefined) updateData.vehicleNumber = data.vehicleNumber;
  if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.driver.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteDriver(id: string) {
  await prisma.schedule.updateMany({
    where: {
      driverId: id,
      status: "scheduled",
    },
    data: {
      driverId: null,
      vehicleNumber: null,
    },
  });

  return prisma.driver.delete({ where: { id } });
}

export async function getDriverAdminStats(id: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, completed, cancelled, recent, upcoming] = await Promise.all([
    prisma.schedule.count({ where: { driverId: id } }),
    prisma.schedule.count({ where: { driverId: id, status: "completed" } }),
    prisma.schedule.count({ where: { driverId: id, status: "cancelled" } }),
    prisma.schedule.count({
      where: {
        driverId: id,
        date: { gte: thirtyDaysAgo },
      },
    }),
    prisma.schedule.count({
      where: {
        driverId: id,
        status: "scheduled",
        date: { gte: now },
      },
    }),
  ]);

  return { total, completed, cancelled, recent, upcoming };
}
