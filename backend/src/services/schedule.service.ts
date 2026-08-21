import prisma from "../lib/prisma.js";
import { parseDurationToMinutes, hasTimeOverlap } from "../utils/date.utils.js";

export async function syncDriverStatus(driverId: string): Promise<void> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  if (!driver) return;
  if (driver.status === "off_duty" || driver.status === "suspended") return;

  const hasActiveTrip = await prisma.schedule.findFirst({
    where: {
      driverId,
      status: "in_progress",
    },
  });

  const newStatus = hasActiveTrip ? "on_trip" : "available";

  if (driver.status !== newStatus) {
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: newStatus },
    });
  }
}

export async function checkDriverConflict(
  driverId: string,
  scheduleId: string,
  scheduleDate: Date,
  scheduleTime: string,
  scheduleDuration: string,
) {
  const conflict = await prisma.schedule.findFirst({
    where: {
      id: { not: scheduleId },
      driverId,
      date: scheduleDate,
      status: { in: ["scheduled", "in_progress"] },
    },
    include: { route: { select: { duration: true } } },
  });

  if (conflict) {
    const [targetH, targetM] = scheduleTime.split(":").map(Number);
    const targetStart = targetH! * 60 + targetM!;
    const targetDuration = parseDurationToMinutes(scheduleDuration);
    const targetEnd = targetStart + targetDuration;

    const [conflictH, conflictM] = conflict.time.split(":").map(Number);
    const conflictStart = conflictH! * 60 + conflictM!;
    const conflictDuration = parseDurationToMinutes(
      conflict.route?.duration ?? "2h",
    );
    const conflictEnd = conflictStart + conflictDuration;

    if (hasTimeOverlap(targetStart, targetEnd, conflictStart, conflictEnd)) {
      return {
        hasConflict: true,
        message: `Ce chauffeur est déjà assigné à un voyage à ${conflict.time} le même jour (durée: ${conflict.route?.duration}). Il ne sera pas disponible avant ${Math.floor(conflictEnd / 60)}h${String(conflictEnd % 60).padStart(2, "0")}.`,
      };
    }
  }

  return { hasConflict: false };
}

export async function assignDriver(
  scheduleId: string,
  driverId: string,
  vehicleNumber?: string,
  performedBy: string = "admin",
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { route: { select: { duration: true } } },
  });
  if (!schedule) {
    return { success: false, status: 404, message: "Horaire introuvable" };
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });
  if (!driver) {
    return { success: false, status: 404, message: "Chauffeur introuvable" };
  }

  const conflict = await checkDriverConflict(
    driverId,
    scheduleId,
    schedule.date,
    schedule.time,
    schedule.route?.duration ?? "2h",
  );
  if (conflict.hasConflict) {
    return { success: false, status: 400, message: conflict.message };
  }

  const previousDriver = schedule.driverId;

  await prisma.$transaction([
    prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        driverId,
        vehicleNumber: vehicleNumber || driver.vehicleNumber,
      },
    }),
    prisma.scheduleHistory.create({
      data: {
        scheduleId,
        action: "assigned_driver",
        performedBy,
        details: `Chauffeur assigné: ${driver.firstName} ${driver.lastName}`,
      },
    }),
  ]);

  if (previousDriver && previousDriver !== driverId) {
    await syncDriverStatus(previousDriver);
  }
  await syncDriverStatus(driverId);

  const populated = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      driver: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          vehicleNumber: true,
          vehicleType: true,
          status: true,
        },
      },
    },
  });

  return { success: true, schedule: populated };
}

export async function unassignDriver(
  scheduleId: string,
  performedBy: string = "admin",
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) {
    return { success: false, status: 404, message: "Horaire introuvable" };
  }

  const previousDriver = schedule.driverId;

  await prisma.$transaction([
    prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        driverId: null,
        vehicleNumber: null,
      },
    }),
    prisma.scheduleHistory.create({
      data: {
        scheduleId,
        action: "unassigned_driver",
        performedBy,
        details: "Chauffeur retiré",
      },
    }),
  ]);

  if (previousDriver) {
    await syncDriverStatus(previousDriver);
  }

  const populated = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      driver: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          vehicleNumber: true,
          vehicleType: true,
          status: true,
        },
      },
    },
  });

  return { success: true, schedule: populated };
}
