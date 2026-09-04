import "dotenv/config";

import cors from "cors";
import express from "express";
import session from "express-session";
import PgSession from "connect-pg-simple";
import pg from "pg";
import prisma from "./lib/prisma.js";
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
import seatTemplateRoutes from "./routes/seatTemplate.route.js";
import userRoutes from "./routes/user.route.js";
import vehicleTemplateRoutes from "./routes/vehicleTemplate.route.js";
import driverRouter from "./routes/driver.route.js";
import { startScheduleAutoStatusJob } from "./jobs/scheduleAutoStatus.js";

import { limiter, sanitizeInput } from "./middleware/security.middleware.js";

const PORT = process.env.PORT || 5000;
const helmet = (helmetPkg as any).default ?? helmetPkg;

if (process.env.NODE_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET", "SESSION_SECRET", "FRONTEND_URL"];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`FATAL: Variable d'environnement ${key} manquante en production`);
      process.exit(1);
    }
  }
}

const app = express();

app.set("trust proxy", 1);

const allowedOrigin = process.env.FRONTEND_URL || "https://cotram.nragency.tech";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(limiter);
app.use(sanitizeInput);
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(compression());

const sessionStore =
  process.env.NODE_ENV === "production"
    ? new (PgSession(session))({
        pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }),
        tableName: "user_sessions",
        createTableIfMissing: true,
      })
    : undefined;

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    ...(sessionStore && { store: sessionStore }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
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

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", timestamp: new Date() });
  } catch {
    res.status(503).json({ status: "ERROR", message: "Database indisponible" });
  }
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
    message: process.env.NODE_ENV === "production" ? "Erreur serveur" : (err.message || "Erreur serveur"),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

let cronInterval: NodeJS.Timeout | undefined;

process.on("SIGTERM", () => {
  console.log("SIGTERM reçu, arrêt propre...");
  if (cronInterval) clearInterval(cronInterval);
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT reçu, arrêt propre...");
  if (cronInterval) clearInterval(cronInterval);
  prisma.$disconnect();
  process.exit(0);
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    cronInterval = startScheduleAutoStatusJob();
  });
})();

export default app;
