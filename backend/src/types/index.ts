// backend/src/types/index.ts
// Ajout de seatConfig dans ISchedule

import type { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "user" | "admin" | "driver";
  googleId?: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}

export interface IRoute extends Document {
  _id: Types.ObjectId;
  departure: string;
  destination: string;
  duration: string;
  distance: number;
  price: number;
  isActive: boolean;
}

export interface IHistory {
  action: string;
  performedBy?: string;
  timestamp?: Date;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

// Plan de sièges configurable (stocké en JSON dans MongoDB)
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

export interface ISchedule extends Document {
  _id: Types.ObjectId;
  route: Types.ObjectId | IRoute;
  date: Date;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number[];
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  driver?: Types.ObjectId | IDriver;
  vehicleNumber?: string | null;
  seatConfig?: ISeatConfig | null; // ← nouveau
  history?: IHistory[];
  actualDeparture?: Date;
  actualArrival?: Date;
  notes?: string;
}

export interface IReservation extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  schedule: Types.ObjectId | ISchedule;
  seats: number[];
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  bookingReference: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface IDriver extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  totalTrips: number;
  joinedAt: Date;
  notes?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user: IUser;
}
