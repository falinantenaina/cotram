import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { emitToStaff } from "../lib/socket.js";
import type { AuthRequest } from "../types/index.js";
import { generateTrackingCode, generateRetrievalCode } from "../utils/tracking.utils.js";

const PARCEL_INCLUDE = {
  departure: true,
  arrival: true,
  schedule: {
    include: {
      route: {
        include: {
          departure: true,
          destination: true,
        },
      },
      driver: true,
    },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  history: {
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.ParcelInclude;

const PUBLIC_PARCEL_SELECT = {
  id: true,
  trackingCode: true,
  parcelType: true,
  description: true,
  note: true,
  status: true,
  paymentStatus: true,
  transportFee: true,
  totalAmount: true,
  paidAmount: true,
  departureDate: true,
  arrivalDate: true,
  storageFeePerDay: true,
  recipientName: true,
  senderName: true,
  createdAt: true,
  updatedAt: true,
  departure: true,
  arrival: true,
  schedule: {
    include: {
      route: {
        include: {
          departure: true,
          destination: true,
        },
      },
      driver: {
        select: {
          firstName: true,
          lastName: true,
          vehicleNumber: true,
        },
      },
    },
  },
  history: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ParcelSelect;

function paymentStatusFromAmounts(total: number, paid: number): "unpaid" | "partial" | "paid" {
  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
}

export const getParcels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const { status, paymentStatus, search, page = 1, limit = 20, scheduleId } = req.query;

    const where: Prisma.ParcelWhereInput = {};

    if (user.role === "agent") {
      where.createdById = user.id;
    }

    if (status && status !== "all") {
      where.status = status as any;
    }
    if (paymentStatus && paymentStatus !== "all") {
      where.paymentStatus = paymentStatus as any;
    }
    if (scheduleId) {
      where.scheduleId = String(scheduleId);
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { trackingCode: { contains: q, mode: "insensitive" } },
        { retrievalCode: { contains: q, mode: "insensitive" } },
        { senderName: { contains: q, mode: "insensitive" } },
        { senderPhone: { contains: q } },
        { recipientName: { contains: q, mode: "insensitive" } },
        { recipientPhone: { contains: q } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [parcels, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
        include: PARCEL_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.parcel.count({ where }),
    ]);

    res.json({
      success: true,
      parcels,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logError("GET /parcels", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getParcelStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, registered, inTransit, arrived, readyForPickup, delivered, returned, monthParcels, unpaidAmount, paidAmount] =
      await Promise.all([
        prisma.parcel.count(),
        prisma.parcel.count({ where: { status: "registered" } }),
        prisma.parcel.count({ where: { status: "in_transit" } }),
        prisma.parcel.count({ where: { status: "arrived" } }),
        prisma.parcel.count({ where: { status: "ready_for_pickup" } }),
        prisma.parcel.count({ where: { status: "delivered" } }),
        prisma.parcel.count({ where: { status: "returned" } }),
        prisma.parcel.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.parcel.aggregate({
          _sum: { totalAmount: true, paidAmount: true },
          where: { paymentStatus: { not: "paid" } },
        }),
        prisma.parcel.aggregate({
          _sum: { paidAmount: true },
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

    res.json({
      success: true,
      stats: {
        total,
        registered,
        in_transit: inTransit,
        arrived,
        ready_for_pickup: readyForPickup,
        delivered,
        returned,
        month: monthParcels,
        outstanding: (unpaidAmount._sum.totalAmount ?? 0) - (unpaidAmount._sum.paidAmount ?? 0),
        collectedThisMonth: paidAmount._sum.paidAmount ?? 0,
      },
    });
  } catch (error) {
    logError("GET /parcels/stats", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const trackParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code).trim().toUpperCase();

    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [{ trackingCode: code }, { retrievalCode: code }],
      },
      select: PUBLIC_PARCEL_SELECT,
    });

    if (!parcel) {
      res.status(404).json({
        success: false,
        message: "Colis introuvable. Vérifiez le numéro de suivi.",
      });
      return;
    }

    res.json({ success: true, parcel });
  } catch (error) {
    logError("GET /parcels/track", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const parcel = await prisma.parcel.findUnique({
      where: { id: String(req.params.id) },
      include: PARCEL_INCLUDE,
    });

    if (!parcel) {
      res.status(404).json({ success: false, message: "Colis non trouvé" });
      return;
    }

    res.json({ success: true, parcel });
  } catch (error) {
    logError("GET /parcels/:id", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const createParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const {
      parcelType,
      description,
      note,
      weightKg,
      departureCityId,
      arrivalCityId,
      scheduleId,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      transportFee,
      totalAmount,
      paidAmount,
      departureDate,
      status,
    } = req.body;

    if (
      !parcelType ||
      !departureCityId ||
      !arrivalCityId ||
      !senderName ||
      !senderPhone ||
      !recipientName ||
      !recipientPhone ||
      transportFee === undefined ||
      totalAmount === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Champs requis : type, départ, arrivée, expéditeur, destinataire, frais et total",
      });
      return;
    }

    if (departureCityId === arrivalCityId) {
      res.status(400).json({
        success: false,
        message: "La ville de départ et d'arrivée doivent être différentes",
      });
      return;
    }

    const [departure, arrival] = await Promise.all([
      prisma.city.findUnique({ where: { id: departureCityId } }),
      prisma.city.findUnique({ where: { id: arrivalCityId } }),
    ]);

    if (!departure || !arrival) {
      res.status(400).json({ success: false, message: "Ville inconnue" });
      return;
    }

    if (scheduleId) {
      const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
      if (!schedule) {
        res.status(400).json({ success: false, message: "Horaire introuvable" });
        return;
      }
    }

    const total = Number(totalAmount);
    const paid = Number(paidAmount ?? 0);
    const fee = Number(transportFee);

    if (total < 0 || paid < 0 || fee < 0) {
      res.status(400).json({ success: false, message: "Les montants doivent être positifs" });
      return;
    }

    if (paid > total) {
      res.status(400).json({
        success: false,
        message: "Le montant payé ne peut pas dépasser le total",
      });
      return;
    }

    let trackingCode = generateTrackingCode();
    let retrievalCode = generateRetrievalCode();

    for (let i = 0; i < 5; i++) {
      const existing = await prisma.parcel.findFirst({
        where: { trackingCode },
      });
      if (!existing) break;
      trackingCode = generateTrackingCode();
    }

    for (let i = 0; i < 5; i++) {
      const existing = await prisma.parcel.findFirst({
        where: { retrievalCode },
      });
      if (!existing) break;
      retrievalCode = generateRetrievalCode();
    }

    const initialStatus = (status as any) || "registered";
    const depDate = departureDate ? new Date(departureDate) : new Date();

    const parcel = await prisma.$transaction(async (tx) => {
      const created = await tx.parcel.create({
        data: {
          trackingCode,
          retrievalCode,
          parcelType,
          description: description || null,
          note: note || null,
          weightKg: weightKg ? Number(weightKg) : null,
          departureCityId,
          arrivalCityId,
          scheduleId: scheduleId || null,
          senderName,
          senderPhone,
          recipientName,
          recipientPhone,
          transportFee: fee,
          totalAmount: total,
          paidAmount: paid,
          paymentStatus: paymentStatusFromAmounts(total, paid),
          status: initialStatus,
          departureDate: depDate,
          arrivalDate: initialStatus === "arrived" || initialStatus === "ready_for_pickup" || initialStatus === "delivered" ? new Date() : null,
          createdById: user.id,
        },
        include: PARCEL_INCLUDE,
      });

      await tx.parcelHistory.create({
        data: {
          parcelId: created.id,
          status: initialStatus,
          note: "Colis enregistré",
          performedBy: user.name,
        },
      });

      return created;
    });

    emitToStaff("parcel:created", {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
      status: parcel.status,
    });

    res.status(201).json({ success: true, parcel });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Conflit de code de suivi, veuillez réessayer",
      });
      return;
    }
    logError("POST /parcels", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const parcelId = String(req.params.id);
    const existing = await prisma.parcel.findUnique({ where: { id: parcelId } });

    if (!existing) {
      res.status(404).json({ success: false, message: "Colis non trouvé" });
      return;
    }

    const {
      parcelType,
      description,
      note,
      weightKg,
      departureCityId,
      arrivalCityId,
      scheduleId,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      transportFee,
      totalAmount,
      departureDate,
    } = req.body;

    const data: Prisma.ParcelUpdateInput = {};

    if (parcelType !== undefined) data.parcelType = parcelType;
    if (description !== undefined) data.description = description || null;
    if (note !== undefined) data.note = note || null;
    if (weightKg !== undefined) data.weightKg = weightKg ? Number(weightKg) : null;
    if (departureCityId !== undefined) data.departure = { connect: { id: departureCityId } };
    if (arrivalCityId !== undefined) data.arrival = { connect: { id: arrivalCityId } };
    if (scheduleId !== undefined) {
      data.schedule = scheduleId ? { connect: { id: scheduleId } } : { disconnect: true };
    }
    if (senderName !== undefined) data.senderName = senderName;
    if (senderPhone !== undefined) data.senderPhone = senderPhone;
    if (recipientName !== undefined) data.recipientName = recipientName;
    if (recipientPhone !== undefined) data.recipientPhone = recipientPhone;
    if (transportFee !== undefined) data.transportFee = Number(transportFee);
    if (departureDate !== undefined) data.departureDate = new Date(departureDate);

    if (totalAmount !== undefined) {
      const newTotal = Number(totalAmount);
      if (newTotal < existing.paidAmount) {
        res.status(400).json({
          success: false,
          message: "Le total ne peut pas être inférieur au montant déjà payé",
        });
        return;
      }
      data.totalAmount = newTotal;
      data.paymentStatus = paymentStatusFromAmounts(newTotal, existing.paidAmount);
    }

    const parcel = await prisma.parcel.update({
      where: { id: parcelId },
      data,
      include: PARCEL_INCLUDE,
    });

    emitToStaff("parcel:updated", {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
    });

    res.json({ success: true, parcel });
  } catch (error) {
    logError("PUT /parcels/:id", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateParcelStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const parcelId = String(req.params.id);
    const { status, note } = req.body;

    const allowed: string[] = [
      "registered",
      "in_transit",
      "arrived",
      "ready_for_pickup",
      "delivered",
      "returned",
    ];

    if (!status || !allowed.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Statut invalide",
      });
      return;
    }

    const existing = await prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Colis non trouvé" });
      return;
    }

    const updates: Prisma.ParcelUpdateInput = { status: status as any };

    if (status === "arrived" && !existing.arrivalDate) {
      updates.arrivalDate = new Date();
    }
    if (status === "delivered" && existing.paymentStatus !== "paid") {
      // Auto-mark paid on delivery if fully covered
      if (existing.paidAmount >= existing.totalAmount) {
        updates.paymentStatus = "paid";
      }
    }

    const parcel = await prisma.$transaction(async (tx) => {
      const updated = await tx.parcel.update({
        where: { id: parcelId },
        data: updates,
        include: PARCEL_INCLUDE,
      });

      await tx.parcelHistory.create({
        data: {
          parcelId,
          status: status as any,
          note: note || null,
          performedBy: user.name,
        },
      });

      return updated;
    });

    emitToStaff("parcel:status", {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
      status: parcel.status,
    });

    res.json({ success: true, parcel });
  } catch (error) {
    logError("PUT /parcels/:id/status", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req as AuthRequest;
    const parcelId = String(req.params.id);
    const { amount, method, note } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      res.status(400).json({ success: false, message: "Montant invalide" });
      return;
    }

    const existing = await prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Colis non trouvé" });
      return;
    }

    const newPaid = existing.paidAmount + payAmount;
    if (newPaid > existing.totalAmount) {
      res.status(400).json({
        success: false,
        message: "Le montant dépasse le reste à payer",
      });
      return;
    }

    const paymentStatus = paymentStatusFromAmounts(existing.totalAmount, newPaid);

    const parcel = await prisma.$transaction(async (tx) => {
      const updated = await tx.parcel.update({
        where: { id: parcelId },
        data: { paidAmount: newPaid, paymentStatus },
        include: PARCEL_INCLUDE,
      });

      const methodLabel = method ? ` (${method})` : "";
      await tx.parcelHistory.create({
        data: {
          parcelId,
          status: existing.status,
          note: `Paiement ${payAmount.toLocaleString()} Ar${methodLabel}${note ? ` — ${note}` : ""}`,
          performedBy: user.name,
        },
      });

      return updated;
    });

    emitToStaff("parcel:payment", {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
      paidAmount: parcel.paidAmount,
      paymentStatus: parcel.paymentStatus,
    });

    res.json({ success: true, parcel });
  } catch (error) {
    logError("POST /parcels/:id/pay", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const deleteParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const parcelId = String(req.params.id);

    const existing = await prisma.parcel.findUnique({ where: { id: parcelId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Colis non trouvé" });
      return;
    }

    if (existing.status !== "registered") {
      res.status(400).json({
        success: false,
        message: "Seul un colis enregistré peut être supprimé",
      });
      return;
    }

    await prisma.parcel.delete({ where: { id: parcelId } });
    res.json({ success: true, message: "Colis supprimé" });
  } catch (error) {
    logError("DELETE /parcels/:id", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getSchedulesForParcels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departureCityId, arrivalCityId, date } = req.query;

    const where: Prisma.ScheduleWhereInput = {
      status: { in: ["scheduled", "in_progress"] },
    };

    if (date) {
      const d = new Date(String(date));
      where.date = {
        gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        lte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
      };
    } else {
      where.date = { gte: new Date() };
    }

    if (departureCityId || arrivalCityId) {
      const routeWhere: Prisma.RouteWhereInput = {};
      if (departureCityId) routeWhere.departureId = String(departureCityId);
      if (arrivalCityId) routeWhere.destinationId = String(arrivalCityId);
      where.route = routeWhere;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: {
          include: {
            departure: true,
            destination: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
            vehicleNumber: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 50,
    });

    res.json({ success: true, schedules });
  } catch (error) {
    logError("GET /parcels/schedules", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
