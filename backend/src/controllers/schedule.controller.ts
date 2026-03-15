// backend/src/controllers/schedule.controller.ts
import type { Request, Response } from "express";
import Route from "../models/route.model.js";
import Schedule from "../models/schedule.model.js";
import { endOfLocalDay, parseLocalDate } from "../utils/date.utils.js";

export const getSchedules = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departure, destination, date } = req.query;
    let filter: any = { status: { $ne: "cancelled" } };

    if (departure || destination) {
      const routeFilter: any = {};
      if (departure) routeFilter.departure = departure;
      if (destination) routeFilter.destination = destination;
      const routes = await Route.find(routeFilter);
      filter.route = { $in: routes.map((r: any) => r._id) };
    }

    if (date) {
      const searchDate = parseLocalDate(date as string);
      filter.date = { $gte: searchDate, $lt: endOfLocalDay(searchDate) };
    }

    let schedules = await Schedule.find(filter)
      .populate("route")
      .sort({ date: 1, time: 1 });

    const now = new Date();
    schedules = schedules.filter((schedule) => {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      const departure = new Date(schedule.date);
      departure.setHours(hours!, minutes!, 0, 0);
      return departure > now;
    });

    res.json({ success: true, schedules });
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
    const schedule = await Schedule.findById(req.params.id).populate("route");
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }
    res.json({ success: true, schedule });
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

    // Calculer totalSeats depuis seatConfig si fourni
    const totalSeats = seatConfig?.totalSeats ?? 16;

    const schedule = await Schedule.create({
      route,
      date,
      time,
      vehicle: vehicle || "Crafter",
      totalSeats,
      availableSeats: totalSeats,
      occupiedSeats: [],
      price,
      status: "scheduled",
      seatConfig: seatConfig ?? null,
    });

    const populatedSchedule = await Schedule.findById(schedule._id).populate(
      "route",
    );
    res.status(201).json({ success: true, schedule: populatedSchedule });
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

    // findById + save obligatoire pour les champs Mixed (seatConfig)
    // findByIdAndUpdate ignore les modifications Mixed sur les docs existants
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }

    Object.assign(schedule, rest);

    if (seatConfig !== undefined) {
      schedule.seatConfig = seatConfig;
      schedule.markModified("seatConfig"); // OBLIGATOIRE pour Schema.Types.Mixed
      if (seatConfig?.totalSeats) {
        schedule.totalSeats = seatConfig.totalSeats;
      }
    }

    await schedule.save({ validateBeforeSave: false });

    const populated = await Schedule.findById(schedule._id).populate("route");
    res.json({ success: true, schedule: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      res.status(404).json({ success: false, message: "Horaire non trouvé" });
      return;
    }
    res.json({ success: true, message: "Horaire supprimé" });
  } catch (error) {
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
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["completed", "cancelled", "in_progress"] };
    }

    if (routeId) filter.route = routeId;
    if (driverId) filter.driver = driverId;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as any).$gte = parseLocalDate(String(from));
      if (to)
        (filter.date as any).$lte = endOfLocalDay(parseLocalDate(String(to)));
    }

    const [schedules, total] = await Promise.all([
      Schedule.find(filter)
        .populate("route", "departure destination duration")
        .populate("driver", "firstName lastName phone vehicleNumber")
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Schedule.countDocuments(filter),
    ]);

    res.json({
      success: true,
      schedules,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
