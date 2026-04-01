import mongoose, { Schema } from "mongoose";

const seatTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      unique: true,
      trim: true,
    },
    seatConfig: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

const SeatTemplate = mongoose.model("SeatTemplate", seatTemplateSchema);
export default SeatTemplate;
