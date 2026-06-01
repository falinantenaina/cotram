import bcrypt from "bcryptjs";
import "dotenv/config";
import prisma from "../lib/prisma.js";

const seedData = async () => {
  try {
    console.log("📦 Connexion DB...");

    await prisma.reservationSeat.deleteMany();
    await prisma.occupiedSeat.deleteMany();
    await prisma.scheduleHistory.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.route.deleteMany();
    await prisma.user.deleteMany();
    console.log("🗑️  Données existantes supprimées");

    const routesResult = await prisma.route.createManyAndReturn({
      data: [
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
      ],
    });

    console.log("✅ Routes créées:", routesResult.length);

    const schedules = [];
    const times = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"];

    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);

      for (const route of routesResult) {
        for (const time of times) {
          schedules.push({
            routeId: route.id,
            date,
            time,
            vehicle: "Crafter" as const,
            totalSeats: 16,
            availableSeats: 16,
            price: route.price,
            status: "scheduled" as const,
          });
        }
      }
    }

    await prisma.schedule.createMany({
      data: schedules,
    });
    console.log("✅ Horaires créés:", schedules.length);

    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@cotram.mg" },
    });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await prisma.user.create({
        data: {
          name: "Admin Cotram",
          email: "admin@cotram.mg",
          phone: "034 00 000 00",
          password: hashedPassword,
          role: "admin",
          isEmailVerified: true,
        },
      });
      console.log("✅ Admin créé: admin@cotram.mg / admin123");
    }

    await prisma.seatTemplate.deleteMany({});
    console.log("🗑️  Templates supprimés");
    // Layout: col 1,2 = left group (gauche), col 4,5 = right group (droite)
    // Row 1 = driver row (1 passenger seat on right side)
    const presets = [
      {
        name: "VW Crafter Standard (16p)",
        isPreset: true,
        seatConfig: {
          totalSeats: 16,
          layoutName: "Crafter 16",
          hasAisle: true,
          rows: [
            { row: 1, isBackBench: false, label: "Chauffeur", seats: [
              { id: 1, row: 1, col: 4, position: "right" },
            ]},
            { row: 2, isBackBench: false, seats: [
              { id: 2, row: 2, col: 1, position: "left" },
              { id: 3, row: 2, col: 2, position: "left" },
              { id: 4, row: 2, col: 4, position: "right" },
              { id: 5, row: 2, col: 5, position: "right" },
            ]},
            { row: 3, isBackBench: false, seats: [
              { id: 6, row: 3, col: 1, position: "left" },
              { id: 7, row: 3, col: 2, position: "left" },
              { id: 8, row: 3, col: 4, position: "right" },
              { id: 9, row: 3, col: 5, position: "right" },
            ]},
            { row: 4, isBackBench: false, seats: [
              { id: 10, row: 4, col: 1, position: "left" },
              { id: 11, row: 4, col: 2, position: "left" },
              { id: 12, row: 4, col: 4, position: "right" },
              { id: 13, row: 4, col: 5, position: "right" },
            ]},
            { row: 5, isBackBench: true, seats: [
              { id: 14, row: 5, col: 1, position: "left" },
              { id: 15, row: 5, col: 2, position: "left" },
              { id: 16, row: 5, col: 4, position: "right" },
            ]},
          ],
        },
      },
      {
        name: "Ford Transit 15 places",
        isPreset: true,
        seatConfig: {
          totalSeats: 15,
          layoutName: "Transit 15",
          hasAisle: true,
          rows: [
            { row: 1, isBackBench: false, label: "Chauffeur", seats: [
              { id: 1, row: 1, col: 4, position: "right" },
            ]},
            { row: 2, isBackBench: false, seats: [
              { id: 2, row: 2, col: 1, position: "left" },
              { id: 3, row: 2, col: 2, position: "left" },
              { id: 4, row: 2, col: 4, position: "right" },
              { id: 5, row: 2, col: 5, position: "right" },
            ]},
            { row: 3, isBackBench: false, seats: [
              { id: 6, row: 3, col: 1, position: "left" },
              { id: 7, row: 3, col: 2, position: "left" },
              { id: 8, row: 3, col: 4, position: "right" },
              { id: 9, row: 3, col: 5, position: "right" },
            ]},
            { row: 4, isBackBench: false, seats: [
              { id: 10, row: 4, col: 1, position: "left" },
              { id: 11, row: 4, col: 2, position: "left" },
              { id: 12, row: 4, col: 4, position: "right" },
              { id: 13, row: 4, col: 5, position: "right" },
            ]},
            { row: 5, isBackBench: true, seats: [
              { id: 14, row: 5, col: 1, position: "left" },
              { id: 15, row: 5, col: 4, position: "right" },
            ]},
          ],
        },
      },
      {
        name: "Renault Master 13 places",
        isPreset: true,
        seatConfig: {
          totalSeats: 13,
          layoutName: "Master 13",
          hasAisle: true,
          rows: [
            { row: 1, isBackBench: false, label: "Chauffeur", seats: [
              { id: 1, row: 1, col: 4, position: "right" },
            ]},
            { row: 2, isBackBench: false, seats: [
              { id: 2, row: 2, col: 1, position: "left" },
              { id: 3, row: 2, col: 2, position: "left" },
              { id: 4, row: 2, col: 4, position: "right" },
              { id: 5, row: 2, col: 5, position: "right" },
            ]},
            { row: 3, isBackBench: false, seats: [
              { id: 6, row: 3, col: 1, position: "left" },
              { id: 7, row: 3, col: 2, position: "left" },
              { id: 8, row: 3, col: 4, position: "right" },
              { id: 9, row: 3, col: 5, position: "right" },
            ]},
            { row: 4, isBackBench: true, seats: [
              { id: 10, row: 4, col: 1, position: "left" },
              { id: 11, row: 4, col: 2, position: "left" },
              { id: 12, row: 4, col: 4, position: "right" },
              { id: 13, row: 4, col: 5, position: "right" },
            ]},
          ],
        },
      },
      {
        name: "Mercedes Sprinter 30 places",
        isPreset: true,
        seatConfig: {
          totalSeats: 30,
          layoutName: "Sprinter 30",
          hasAisle: true,
          rows: [
            { row: 1, isBackBench: false, label: "Chauffeur", seats: [
              { id: 1, row: 1, col: 4, position: "right" },
            ]},
            { row: 2, isBackBench: false, seats: [
              { id: 2, row: 2, col: 1, position: "left" },
              { id: 3, row: 2, col: 2, position: "left" },
              { id: 4, row: 2, col: 4, position: "right" },
              { id: 5, row: 2, col: 5, position: "right" },
            ]},
            { row: 3, isBackBench: false, seats: [
              { id: 6, row: 3, col: 1, position: "left" },
              { id: 7, row: 3, col: 2, position: "left" },
              { id: 8, row: 3, col: 4, position: "right" },
              { id: 9, row: 3, col: 5, position: "right" },
            ]},
            { row: 4, isBackBench: false, seats: [
              { id: 10, row: 4, col: 1, position: "left" },
              { id: 11, row: 4, col: 2, position: "left" },
              { id: 12, row: 4, col: 4, position: "right" },
              { id: 13, row: 4, col: 5, position: "right" },
            ]},
            { row: 5, isBackBench: false, seats: [
              { id: 14, row: 5, col: 1, position: "left" },
              { id: 15, row: 5, col: 2, position: "left" },
              { id: 16, row: 5, col: 4, position: "right" },
              { id: 17, row: 5, col: 5, position: "right" },
            ]},
            { row: 6, isBackBench: false, seats: [
              { id: 18, row: 6, col: 1, position: "left" },
              { id: 19, row: 6, col: 2, position: "left" },
              { id: 20, row: 6, col: 4, position: "right" },
              { id: 21, row: 6, col: 5, position: "right" },
            ]},
            { row: 7, isBackBench: false, seats: [
              { id: 22, row: 7, col: 1, position: "left" },
              { id: 23, row: 7, col: 2, position: "left" },
              { id: 24, row: 7, col: 4, position: "right" },
              { id: 25, row: 7, col: 5, position: "right" },
            ]},
            { row: 8, isBackBench: true, seats: [
              { id: 26, row: 8, col: 1, position: "left" },
              { id: 27, row: 8, col: 2, position: "left" },
              { id: 28, row: 8, col: 3, position: "left" },
              { id: 29, row: 8, col: 4, position: "right" },
              { id: 30, row: 8, col: 5, position: "right" },
            ]},
          ],
        },
      },
      {
        name: "Mercedes Sprinter 19 places",
        isPreset: true,
        seatConfig: {
          totalSeats: 19,
          layoutName: "Sprinter 19",
          hasAisle: true,
          rows: [
            { row: 1, isBackBench: false, label: "Chauffeur", seats: [
              { id: 1, row: 1, col: 4, position: "right" },
            ]},
            { row: 2, isBackBench: false, seats: [
              { id: 2, row: 2, col: 1, position: "left" },
              { id: 3, row: 2, col: 2, position: "left" },
              { id: 4, row: 2, col: 4, position: "right" },
              { id: 5, row: 2, col: 5, position: "right" },
            ]},
            { row: 3, isBackBench: false, seats: [
              { id: 6, row: 3, col: 1, position: "left" },
              { id: 7, row: 3, col: 2, position: "left" },
              { id: 8, row: 3, col: 4, position: "right" },
              { id: 9, row: 3, col: 5, position: "right" },
            ]},
            { row: 4, isBackBench: false, seats: [
              { id: 10, row: 4, col: 1, position: "left" },
              { id: 11, row: 4, col: 2, position: "left" },
              { id: 12, row: 4, col: 4, position: "right" },
              { id: 13, row: 4, col: 5, position: "right" },
            ]},
            { row: 5, isBackBench: false, seats: [
              { id: 14, row: 5, col: 1, position: "left" },
              { id: 15, row: 5, col: 2, position: "left" },
              { id: 16, row: 5, col: 4, position: "right" },
              { id: 17, row: 5, col: 5, position: "right" },
            ]},
            { row: 6, isBackBench: true, seats: [
              { id: 18, row: 6, col: 1, position: "left" },
              { id: 19, row: 6, col: 4, position: "right" },
            ]},
          ],
        },
      },
    ];
    await prisma.seatTemplate.createMany({ data: presets });
    console.log("✅ Templates prédéfinis créés:", presets.length);

    console.log("🎉 Données de test créées avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

seedData();
