import express from "express";
import { authorize, protect } from "../middleware/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();

// User's own payment history (mvola + orange_money, all statuses) — authenticated
router.get("/history", protect, paymentController.getMyPaymentHistory);

// Admin + caissier: successful payments only — must be before /:id
router.get(
  "/admin/history",
  protect,
  authorize("admin", "caissier"),
  paymentController.getAdminPaymentHistory,
);

// Initiate a payment for a reservation (authenticated)
router.post("/initiate", protect, paymentController.initiatePayment);

// Poll payment status (authenticated) — called every 3s by frontend
router.get("/:id/status", protect, paymentController.getPaymentStatus);

// Get payment details (authenticated)
router.get("/:id", protect, paymentController.getPayment);

// Mvola webhook callback (unauthenticated — server-to-server)
router.post("/callback", paymentController.mvolaCallback);

export default router;
