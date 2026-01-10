import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/database.js";

import authRoutes from "./routes/auth.route.js";

dotenv.config();

const PORT = process.env.PORT || 500;

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
  });
})();
