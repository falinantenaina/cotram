import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 500;

const app = express();

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
  });
})();
