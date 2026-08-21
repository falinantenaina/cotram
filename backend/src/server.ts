import "dotenv/config";

import path from "path";
import cors from "cors";
import express from "express";
import session from "express-session";
import { connectDB } from "./config/database.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import compression from "compression";
import * as helmetPkg from "helmet";

import "./config/passport.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import cityRoutes from "./routes/city.route.js";
import contactRoutes from "./routes/contact.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import routeRoutes from "./routes/route.route.js";
import scheduleRoutes from "./routes/schedule.route.js";
import seatTemplateRoutes from "./routes/seatTemplate.routes.js";
import userRoutes from "./routes/user.route.js";
import vehicleTemplateRoutes from "./routes/vehicleTemplate.routes.js";
import driverRouter from "./routes/driver.route.js";
import { startScheduleAutoStatusJob } from "./jobs/scheduleAutoStatus.js";

import { limiter, sanitizeInput } from "./middleware/security.middleware.js";

const PORT = process.env.PORT || 5000;
const helmet = (helmetPkg as any).default ?? helmetPkg;

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(limiter);
app.use(sanitizeInput);
app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : process.env.FRONTEND_URL || "http://localhost:5173",
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
app.use("/api/cities", cityRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/vehicle-templates", vehicleTemplateRoutes);
app.use("/api/seat-templates", seatTemplateRoutes);
app.use("/api/drivers", driverRouter);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ message: "API OK" });
});

app.post("/api/cron/auto-status", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  startScheduleAutoStatusJob();
  res.json({ success: true, message: "Auto-status job triggered" });
});

// Production: servir les fichiers statiques du frontend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  // SPA fallback: toutes les routes non-API servent index.html
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// 404 handler (dev uniquement)
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

if (process.env.NODE_ENV === "development") {
  (async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`The server is running on http://localhost:${PORT}`);
      startScheduleAutoStatusJob();
    });
  })();
}

export default app;
