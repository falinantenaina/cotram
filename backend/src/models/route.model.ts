import mongoose, { Schema } from "mongoose";
import type { IRoute } from "../types/index.js";

const routeSchema = new Schema<IRoute>(
  {
    departure: {
      type: String,
      required: [true, "Le point de départ est requis"],
      enum: {
        values: ["Antananarivo", "Antsirabe", "Ambatolampy"],
        message: "{VALUE} n'est pas une ville valide",
      },
    },
    destination: {
      type: String,
      required: [true, "La destination est requise"],
      enum: {
        values: ["Antananarivo", "Antsirabe", "Ambatolampy"],
        message: "{VALUE} n'est pas une ville valide",
      },
    },
    duration: {
      type: String,
      required: [true, "La durée est requise"],
    },
    distance: {
      type: Number,
      required: [true, "La distance est requise"],
      min: [0, "La distance doit être positive"],
    },
    price: {
      type: Number,
      required: [true, "Le prix est requis"],
      min: [0, "Le prix doit être positif"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour recherche rapide
routeSchema.index({ departure: 1, destination: 1 });

// Validation: départ ≠ destination
routeSchema.pre("save", function (next) {
  if (this.departure === this.destination) {
    new Error("Le départ et la destination doivent être différents");
  }
});
const Route = mongoose.model<IRoute>("Route", routeSchema);

export default Route;
