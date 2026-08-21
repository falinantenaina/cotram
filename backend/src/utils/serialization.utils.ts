import type { Schedule, Reservation } from "@prisma/client";

type ScheduleWithOccupied = Schedule & {
  occupiedSeats?: { seatNumber: number }[];
};

export function withOccupiedSeats(schedule: ScheduleWithOccupied) {
  return {
    ...schedule,
    occupiedSeats: (schedule.occupiedSeats ?? []).map(
      (s: { seatNumber: number }) => s.seatNumber,
    ),
  };
}

type ReservationWithSeats = Reservation & {
  seats?: { seatNumber: number }[];
};

export function flattenReservationSeats(reservation: ReservationWithSeats) {
  return {
    ...reservation,
    seats: (reservation.seats ?? []).map(
      (s: { seatNumber: number }) => s.seatNumber,
    ),
  };
}
