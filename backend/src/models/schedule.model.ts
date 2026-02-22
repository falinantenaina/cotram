import mongoose, { Schema } from "mongoose";
import type { ISchedule } from "../types/index.js";

const scheduleSchema = new Schema<ISchedule>(
  {
    route: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: [true, "Le trajet est requis"],
    },
    date: {
      type: Date,
      required: [true, "La date est requise"],
    },
    time: {
      type: String,
      required: [true, "L'heure est requise"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Format d'heure invalide (HH:MM)",
      ],
    },
    vehicle: {
      type: String,
      default: "Crafter",
      enum: {
        values: ["Crafter", "Sprinter", "Transit"],
        message: "{VALUE} n'est pas un véhicule valide",
      },
    },
    totalSeats: {
      type: Number,
      default: 16,
      min: [1, "Le nombre de sièges doit être positif"],
      max: [20, "Maximum 20 sièges"],
    },
    availableSeats: {
      type: Number,
      default: 16,
      min: [0, "Les sièges disponibles ne peuvent pas être négatifs"],
    },
    occupiedSeats: [
      {
        type: Number,
        min: 1,
        max: 20,
        validate: {
          validator: function (this: ISchedule, seatNumber: number) {
            return seatNumber <= this.totalSeats;
          },
          message: "Le numéro de siège dépasse le total de sièges",
        },
      },
    ],
    price: {
      type: Number,
      required: [true, "Le prix est requis"],
      min: [0, "Le prix doit être positif"],
    },
    status: {
      type: String,
      enum: {
        values: ["scheduled", "in_progress", "completed", "cancelled"],
        message: "{VALUE} n'est pas un statut valide",
      },
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche par date et route
scheduleSchema.index({ route: 1, date: 1, time: 1 });
scheduleSchema.index({ date: 1, status: 1 });

// Validation : vérifier que la date+heure combinées sont dans le futur
scheduleSchema.pre("save", function () {
  if (this.isNew && this.date && this.time) {
    const [hours, minutes] = this.time.split(":").map(Number);
    const departure = new Date(this.date);
    departure.setHours(hours!, minutes!, 0, 0);

    if (departure <= new Date()) {
      new Error("Le départ doit être dans le futur (date + heure)");
    }
  }
});

// Validation: sièges disponibles cohérents
scheduleSchema.pre("save", function (next) {
  if (this.availableSeats + this.occupiedSeats.length > this.totalSeats) {
    new Error("Incohérence dans le nombre de sièges");
  }

  // Vérifier les doublons dans occupiedSeats
  const uniqueSeats = new Set(this.occupiedSeats);
  if (uniqueSeats.size !== this.occupiedSeats.length) {
    new Error("Sièges en double détectés");
  }
});

// Méthode virtuelle pour vérifier si complet
scheduleSchema.virtual("isFull").get(function () {
  return this.availableSeats === 0;
});

const Schedule = mongoose.model<ISchedule>("Schedule", scheduleSchema);
export default Schedule;
