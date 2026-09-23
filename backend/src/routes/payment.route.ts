import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();

// Initiate a payment for a reservation (authenticated)
router.post("/initiate", protect, paymentController.initiatePayment);

// Poll payment status (authenticated) — called every 3s by frontend
router.get("/:id/status", protect, paymentController.getPaymentStatus);

// Get payment details (authenticated)
router.get("/:id", protect, paymentController.getPayment);

// Mvola webhook callback (unauthenticated — server-to-server)
router.post("/callback", paymentController.mvolaCallback);

export default router;
