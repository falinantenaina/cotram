import api from "../lib/axios";

export interface Reservation {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  schedule: {
    id: string;
    date: string;
    time: string;
    route: {
      departure: { id: string; name: string } | string;
      destination: { id: string; name: string } | string;
      price: number;
    };
  };
  seats: number[];
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  bookingReference: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateReservationData {
  scheduleId: string;
  seats: number[];
}

export const reservationApi = {
  getReservations: async (): Promise<Reservation[]> => {
    const { data } = await api.get("/reservations");
    return data.reservations;
  },

  getReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.get(`/reservations/${id}`);
    return data.reservation;
  },

  createReservation: async (
    reservationData: CreateReservationData,
  ): Promise<Reservation> => {
    const { data } = await api.post("/reservations", reservationData);
    return data.reservation;
  },

  confirmReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.put(`/reservations/${id}/confirm`);
    return data.reservation;
  },

  cancelReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.put(`/reservations/${id}/cancel`);
    return data.reservation;
  },
};
