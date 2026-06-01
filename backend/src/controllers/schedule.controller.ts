import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { endOfLocalDay, parseLocalDate } from "../utils/date.utils.js";

function withOccupiedSeats(schedule: any) {
  return {
    ...schedule,
    occupiedSeats: (schedule.occupiedSeats ?? []).map(
      (s: { seatNumber: number }) => s.seatNumber,
    ),
  };
}

export const getSchedules = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departure, destination, date } = req.query;

    const where: any = { status: { not: "cancelled" } };

    if (departure || destination) {
      const routeWhere: any = {};
      if (departure) routeWhere.departure = departure;
      if (destination) routeWhere.destination = destination;
      where.route = routeWhere;
    }

    if (date) {
      const searchDate = parseLocalDate(date as string);
      where.date = {
        gte: searchDate,
        lt: endOfLocalDay(searchDate),
      };
    }

    let schedules = await prisma.schedule.findMany({
      where,
      include: { route: true, occupiedSeats: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    const now = new Date();
    schedules = schedules.filter((schedule: any) => {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      const departure = new Date(schedule.date);
      departure.setHours(hours!, minutes!, 0, 0);
      return departure > now;
    });

    res.json({
      success: true,
      schedules: schedules.map(withOccupiedSeats),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: String(req.params.id) },
      include: { route: true, occupiedSeats: true },
    });
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }
    res.json({ success: true, schedule: withOccupiedSeats(schedule) });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { route, date, time, vehicle, price, seatConfig } = req.body;

    const totalSeats = seatConfig?.totalSeats ?? 16;

    const schedule = await prisma.schedule.create({
      data: {
        routeId: route,
        date: new Date(date),
        time,
        vehicle: vehicle || "Crafter",
        totalSeats,
        availableSeats: totalSeats,
        price,
        status: "scheduled",
        seatConfig: seatConfig ?? undefined,
      },
    });

    const populatedSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: { route: true, occupiedSeats: true },
    });
    res.status(201).json({
      success: true,
      schedule: withOccupiedSeats(populatedSchedule),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { seatConfig, ...rest } = req.body;

    const data: any = { ...rest };
    if (seatConfig !== undefined) {
      data.seatConfig = seatConfig;
      if (seatConfig?.totalSeats) {
        data.totalSeats = seatConfig.totalSeats;
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: String(req.params.id) },
      data,
    });

    const populated = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: { route: true, occupiedSeats: true },
    });
    res.json({ success: true, schedule: withOccupiedSeats(populated) });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.schedule.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ success: true, message: "Horaire supprimé" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }
    console.log(error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getSheduleHistory = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      routeId,
      driverId,
      from,
      to,
      status,
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["completed", "cancelled", "in_progress"] };
    }

    if (routeId) where.routeId = routeId;
    if (driverId) where.driverId = driverId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = parseLocalDate(String(from));
      if (to) where.date.lte = endOfLocalDay(parseLocalDate(String(to)));
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          route: { select: { departure: true, destination: true, duration: true } },
          driver: { select: { firstName: true, lastName: true, phone: true, vehicleNumber: true } },
          occupiedSeats: true,
        },
        orderBy: { date: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.schedule.count({ where }),
    ]);

    res.json({
      success: true,
      schedules: schedules.map(withOccupiedSeats),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
