import type { Document } from "mongoose";

export interface IUser extends Document {
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
  comparePassword(canditatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}

export interface IRoute extends Document {
  route: string;
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
  user: string;
  schedule: string;
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
