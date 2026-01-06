export type SeatStatus = "available" | "selected" | "occupied";

export type Seat = {
  id: number;
  row: number;
  position: "left" | "middle" | "right";
  status: SeatStatus;
};

export type TimeSlot = {
  id: string;
  time: string;
  availableSeats: number;
  price: number;
};

export type Step = "route" | "time" | "seats";
