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
  expiresAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}
