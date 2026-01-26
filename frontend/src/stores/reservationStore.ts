import { create } from "zustand";

interface ReservationTempState {
  scheduleId: string | null;
  selectedSeats: number[];
  departure: string;
  destination: string;
  date: string;
  time: string;
  price: number;

  setScheduleId: (id: string) => void;
  setSelectedSeats: (seats: number[]) => void;
  toggleSeat: (seat: number) => void;
  setTripDetails: (details: {
    departure: string;
    destination: string;
    date: string;
    time: string;
    price: number;
  }) => void;
  clearReservation: () => void;
}

export const useReservationTempStore = create<ReservationTempState>((set) => ({
  scheduleId: null,
  selectedSeats: [],
  departure: "",
  destination: "",
  date: new Date().toISOString().split("T")[0],
  time: "",
  price: 0,

  setScheduleId: (id) => set({ scheduleId: id }),

  setSelectedSeats: (seats) => set({ selectedSeats: seats }),

  toggleSeat: (seat) =>
    set((state) => {
      const isSelected = state.selectedSeats.includes(seat);
      return {
        selectedSeats: isSelected
          ? state.selectedSeats.filter((s) => s !== seat)
          : [...state.selectedSeats, seat],
      };
    }),

  setTripDetails: (details) => set(details),

  clearReservation: () =>
    set({
      scheduleId: null,
      selectedSeats: [],
      departure: "",
      destination: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      price: 0,
    }),
}));
