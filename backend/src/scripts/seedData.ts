import dotenv from "dotenv";
import mongoose from "mongoose";
import Route from "../models/route.model.js";
import Schedule from "../models/schedule.model.js";
import User from "../models/user.model.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("📦 Connexion DB...");

    // Clear existing data
    await Route.deleteMany({});
    await Schedule.deleteMany({});
    console.log("🗑️  Données existantes supprimées");

    // Create routes
    const routes = await Route.create([
      {
        departure: "Antananarivo",
        destination: "Antsirabe",
        duration: "5h 30min",
        distance: 170,
        price: 20000,
        isActive: true,
      },
      {
        departure: "Antananarivo",
        destination: "Ambatolampy",
        duration: "2h 30min",
        distance: 68,
        price: 15000,
        isActive: true,
      },
      {
        departure: "Antsirabe",
        destination: "Antananarivo",
        duration: "5h 30min",
        distance: 170,
        price: 20000,
        isActive: true,
      },
    ]);

    console.log("✅ Routes créées:", routes.length);

    // Create schedules for the next 7 days
    const schedules = [];
    const times = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"];

    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);

      for (const route of routes) {
        for (const time of times) {
          schedules.push({
            route: route._id,
            date,
            time,
            vehicle: "Crafter",
            totalSeats: 16,
            availableSeats: 16,
            occupiedSeats: [],
            price: route.price,
            status: "scheduled",
          });
        }
      }
    }

    await Schedule.insertMany(schedules);
    console.log("✅ Horaires créés:", schedules.length);

    // Create admin user
    const adminExists = await User.findOne({ email: "admin@cotram.mg" });
    if (!adminExists) {
      await User.create({
        name: "Admin Cotram",
        email: "admin@cotram.mg",
        phone: "034 00 000 00",
        password: "admin123",
        role: "admin",
        isEmailVerified: true,
      });
      console.log("✅ Admin créé: admin@cotram.mg / admin123");
    }

    console.log("🎉 Données de test créées avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

seedData();
