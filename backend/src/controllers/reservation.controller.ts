import type { Response } from "express";
import { sendReservationConfirmation } from "../config/email.js";
import Reservation from "../models/reservation.model.js";
import Schedule from "../models/schedule.model.js";
import type { AuthRequest } from "../types/index.js";

export const getReservations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reservations = await Reservation.find({ user: req.user!._id })
      .populate({
        path: "schedule",
        populate: { path: "route" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reservations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getReservation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).populate({
      path: "schedule",
      populate: { path: "route" },
    });

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
      return;
    }

    res.json({
      success: true,
      reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const cancelReservation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).populate("schedule");

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
      return;
    }

    if (reservation.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Cette réservation est déjà annulée",
      });
      return;
    }

    if (reservation.status === "completed") {
      res.status(400).json({
        success: false,
        message: "Impossible d'annuler une réservation complétée",
      });
      return;
    }

    // Libérer les sièges dans le schedule
    const schedule = await Schedule.findById(reservation.schedule);
    if (schedule) {
      schedule.occupiedSeats = schedule.occupiedSeats.filter(
        (seat) => !reservation.seats.includes(seat),
      );
      schedule.availableSeats += reservation.seats.length;
      await schedule.save();
    }

    // Mettre à jour le statut de la réservation
    reservation.status = "cancelled";
    if (reservation.paymentStatus === "paid") {
      reservation.paymentStatus = "refunded";
    }
    await reservation.save();

    res.json({
      success: true,
      message: "Réservation annulée avec succès",
      reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createReservation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { scheduleId, seats } = req.body;

    const schedule = await Schedule.findById(scheduleId).populate("route");
    if (!schedule) {
      res.status(404).json({
        success: false,
        message: "Horaire non trouvé",
      });
      return;
    }

    const unavailableSeats = seats.filter((seat: number) =>
      schedule.occupiedSeats.includes(seat),
    );

    if (unavailableSeats.length > 0) {
      res.status(400).json({
        success: false,
        message: "Certains sièges sont déjà occupés",
        unavailableSeats,
      });
      return;
    }

    const totalPrice = seats.length * schedule.price;

    const reservation = await Reservation.create({
      user: req.user!._id,
      schedule: scheduleId,
      seats,
      totalPrice,
    });

    schedule.occupiedSeats.push(...seats);
    schedule.availableSeats -= seats.length;
    await schedule.save();

    const populatedReservation = await Reservation.findById(
      reservation._id,
    ).populate({
      path: "schedule",
      populate: { path: "route" },
    });

    res.status(201).json({
      success: true,
      reservation: populatedReservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const confirmReservation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({
        path: "schedule",
        populate: { path: "route" },
      })
      .populate("user");

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
      return;
    }

    reservation.status = "confirmed";
    reservation.paymentStatus = "paid";
    reservation.expiresAt = null;
    await reservation.save();

    // Envoyer email de confirmation
    try {
      const route = (reservation.schedule as any).route;
      await sendReservationConfirmation(
        (reservation.user as any).email,
        (reservation.user as any).name,
        reservation.bookingReference,
        {
          departure: route.departure,
          destination: route.destination,
          date: new Date((reservation.schedule as any).date).toLocaleDateString(
            "fr-FR",
          ),
          time: (reservation.schedule as any).time,
          seats: reservation.seats,
          totalPrice: reservation.totalPrice,
        },
      );
    } catch (error) {
      console.error("Erreur envoi email confirmation:", error);
    }

    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
