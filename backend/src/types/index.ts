import type { Request } from "express";

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  role: "user" | "admin" | "driver";
  googleId?: string | null;
  avatar?: string | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoute {
  id: string;
  departureId: string;
  destinationId: string;
  departure: { id: string; name: string; region?: string | null };
  destination: { id: string; name: string; region?: string | null };
  duration: string;
  distance: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHistory {
  id: string;
  scheduleId: string;
  action: string;
  performedBy?: string;
  timestamp?: Date;
  details?: string;
}

export interface ISeatRowDef {
  row: number;
  isBackBench: boolean;
  label?: string;
  seats: {
    id: number;
    row: number;
    col: number;
    position: "left" | "middle" | "right" | "aisle";
  }[];
}

export interface ISeatConfig {
  totalSeats: number;
  layoutName?: string;
  rows: ISeatRowDef[];
}

export interface ISchedule {
  id: string;
  routeId: string;
  date: Date;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  driverId?: string | null;
  vehicleNumber?: string | null;
  seatConfig?: ISeatConfig | null;
  history?: IHistory[];
  actualDeparture?: Date | null;
  actualArrival?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservation {
  id: string;
  userId: string;
  scheduleId: string;
  seats: number[];
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  bookingReference: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface IDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  totalTrips: number;
  joinedAt: Date;
  notes?: string | null;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user: IUser;
}
