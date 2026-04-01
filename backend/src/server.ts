import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import { connectDB } from "./config/database.js";

import cookieParser from "cookie-parser";
import passport from "passport";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import routeRoutes from "./routes/route.route.js";
import scheduleRoutes from "./routes/schedule.route.js";
import seatTemplateRoutes from "./routes/seatTemplate.routes.js";
import userRoutes from "./routes/user.route.js";
import vehicleTemplateRoutes from "./routes/vehicleTemplate.routes.js";

dotenv.config();

import compression from "compression";
import helmet from "helmet";
import "./config/passport.js";
import { startScheduleAutoStatusJob } from "./jobs/scheduleAutoStatus.js";
import driverRouter from "./routes/driver.route.js";
const PORT = process.env.PORT || 5000;

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(compression());

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
app.use("/api/users", userRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vehicle-templates", vehicleTemplateRoutes);
app.use("/api/seat-templates", seatTemplateRoutes);
app.use("/api/drivers", driverRouter);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
    startScheduleAutoStatusJob();
  });
})();

export default app;
