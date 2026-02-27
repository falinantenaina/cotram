import mongoose, { Schema } from "mongoose";
import type { IReservation } from "../types/index.js";

const reservationSchema = new Schema<IReservation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur est requis"],
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: [true, "L'horaire est requis"],
    },
    seats: [
      {
        type: Number,
        required: true,
        min: [1, "Numéro de siège invalide"],
        max: [20, "Numéro de siège invalide"],
      },
    ],
    totalPrice: {
      type: Number,
      required: [true, "Le prix total est requis"],
      min: [0, "Le prix doit être positif"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed"],
        message: "{VALUE} n'est pas un statut valide",
      },
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "refunded"],
        message: "{VALUE} n'est pas un statut de paiement valide",
      },
      default: "pending",
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche rapide
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ schedule: 1 });
reservationSchema.index({ bookingReference: 1 });
reservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, sparse: true },
); // TTL index

// Générer référence de réservation unique
reservationSchema.pre("save", function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.bookingReference = `CTR${timestamp}${random}`;
  }
});

// Validation: au moins 1 siège
reservationSchema.pre("save", function (next) {
  if (this.seats.length === 0) {
    new Error("Au moins un siège doit être sélectionné");
  }

  // Vérifier les doublons
  const uniqueSeats = new Set(this.seats);
  if (uniqueSeats.size !== this.seats.length) {
    new Error("Sièges en double dans la réservation");
  }
});

// Méthode virtuelle pour vérifier si expiré
reservationSchema.virtual("isExpired").get(function () {
  return this.status === "pending" && new Date() > this.expiresAt;
});

// Méthode pour calculer le prix
reservationSchema.methods.calculateTotalPrice = function (
  pricePerSeat: number,
) {
  return this.seats.length * pricePerSeat;
};

const Reservation = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema,
);
export default Reservation;
