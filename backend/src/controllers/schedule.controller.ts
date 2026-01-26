import type { Request, Response } from "express";
import Route from "../models/route.model.js";
import Schedule from "../models/schedule.model.js";

export const getSchedules = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { departure, destination, date } = req.query;

    // Construire le filtre de recherche
    let filter: any = { status: { $ne: "cancelled" } };

    // Si on a les filtres de trajet
    if (departure || destination) {
      const routeFilter: any = {};
      if (departure) routeFilter.departure = departure;
      if (destination) routeFilter.destination = destination;

      // Trouver les routes correspondantes
      const routes = await Route.find(routeFilter);
      const routeIds = routes.map((r: any) => r._id);
      filter.route = { $in: routeIds };
    }

    // Filtre par date
    if (date) {
      const searchDate = new Date(date as string);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = {
        $gte: searchDate,
        $lt: nextDay,
      };
    }

    const schedules = await Schedule.find(filter)
      .populate("route")
      .sort({ date: 1, time: 1 });

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
      res.status(404).json({
        success: false,
        message: "Horaire non trouvé",
      });
      return;
    }

    res.json({ success: true, schedule });
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { route, date, time, vehicle, price } = req.body;

    const schedule = await Schedule.create({
      route,
      date,
      time,
      vehicle: vehicle || "Crafter",
      totalSeats: 16,
      availableSeats: 16,
      occupiedSeats: [],
      price,
      status: "scheduled",
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
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("route");

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: "Horaire non trouvé",
      });
      return;
    }

    res.json({ success: true, schedule });
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
      res.status(404).json({
        success: false,
        message: "Horaire non trouvé",
      });
      return;
    }

    res.json({ success: true, message: "Horaire supprimé" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
