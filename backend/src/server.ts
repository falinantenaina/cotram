import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { connectDB } from "./config/database.js";

import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

import "./config/passport.js";
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());

app.use("/api/auth", authRoutes);

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
  });
})();
