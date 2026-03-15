// backend/src/models/vehicleTemplate.model.ts
// Stocke le plan de sièges par défaut pour chaque type de véhicule

import mongoose, { Schema } from "mongoose";

const vehicleTemplateSchema = new Schema(
  {
    vehicleType: {
      type: String,
      required: true,
      unique: true,
      enum: ["Crafter", "Sprinter", "Transit"],
    },
    seatConfig: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

const VehicleTemplate = mongoose.model(
  "VehicleTemplate",
  vehicleTemplateSchema,
);
export default VehicleTemplate;
