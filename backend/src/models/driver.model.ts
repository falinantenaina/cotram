import mongoose, { Schema } from "mongoose";
import type { IDriver } from "../types/index.js";

const driverSchema = new Schema<IDriver>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleType: {
      type: String,
      required: true,
      enum: ["Crafter", "Sprinter", "Transit"],
      default: "Crafter",
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "off_duty", "suspended"],
      default: "available",
    },
    totalTrips: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    notes: { type: String },
    avatar: { type: String },
  },
  { timestamps: true },
);

const Driver = mongoose.model<IDriver>("Driver", driverSchema);

export default Driver;
