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
  paymentMethod?: string | null;
  bookingReference: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateReservationData {
  scheduleId: string;
  seats: number[];
  paymentMethod?: "mvola" | "orange_money" | "cash";
}

export interface CreateReservationResponse {
  reservation: Reservation;
  paymentId?: string;
}

export interface PaymentInitiateData {
  scheduleId: string;
  seats: number[];
  phone: string;
  method?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: "pending" | "completed" | "failed";
  serverCorrelationId?: string | null;
  mvolaTransactionRef?: string | null;
  reservationId: string | null;
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

export const paymentApi = {
  initiate: async (payload: PaymentInitiateData): Promise<PaymentStatus> => {
    const { data } = await api.post("/payments/initiate", payload);
    return {
      paymentId: data.paymentId,
      status: data.status,
      serverCorrelationId: data.serverCorrelationId,
      reservationId: data.reservationId ?? null,
    };
  },

  getStatus: async (paymentId: string): Promise<PaymentStatus> => {
    const { data } = await api.get(`/payments/${paymentId}/status`);
    return {
      paymentId: data.paymentId,
      status: data.status,
      serverCorrelationId: data.serverCorrelationId,
      mvolaTransactionRef: data.mvolaTransactionRef,
      reservationId: data.reservationId ?? null,
    };
  },
};
