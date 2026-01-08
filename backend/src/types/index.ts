import type { Request } from "express";
import type { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  comparePassword(password: string): Promise<boolean>;
}

export interface IRoute extends Document {
  departure: string;
  date: Date;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number[];
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "candelled";
}

export interface IReservation extends Document {
  user: string;
  schedule: string;
  seats: number[];
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  bookinReference: string;
  createdAt: Date;
  expriresAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}
