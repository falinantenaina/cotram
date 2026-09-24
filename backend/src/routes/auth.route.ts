import express from "express";
import { body } from "express-validator";
import passport from "../config/passport.js";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/security.middleware.js";
import { PHONE_REGEX, normalizePhone } from "../utils/phone.utils.js";

const router = express.Router();

// Routes classiques
router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty().withMessage("Le nom est requis"),
    body("email").isEmail().withMessage("Email invalide"),
    body("phone")
      .optional({ nullable: true, checkFalsy: true })
      .custom((value: string) => PHONE_REGEX.test(normalizePhone(value)))
      .withMessage("Numéro de téléphone invalide (format : 03XXXXXXXX)"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mot de passe min 6 caractères"),
  ],
  authController.register,
);

router.post(
  "/login",
  authLimiter,
  [
    body("identifier")
      .notEmpty()
      .withMessage("Email ou téléphone requis")
      .custom((value: string) => {
        const v = value.trim();
        if (v.includes("@")) return true; // email identifier
        return PHONE_REGEX.test(normalizePhone(v));
      })
      .withMessage("Identifiant invalide (email ou téléphone 03XXXXXXXX)"),
    body("password").notEmpty().withMessage("Mot de passe requis"),
  ],
  authController.login,
);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google`,
  }),
  authController.googleAuthCallback,
);

// Email verification
router.get("/verify-email/:token", authController.verifyEmail);

router.get("/me", protect, authController.getMe);

// Password reset
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Email invalide")],
  authController.forgotPassword,
);

router.post(
  "/reset-password/:token",
  authLimiter,
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mot de passe min 6 caractères"),
  ],
  authController.resetPassword,
);

router.post("/logout", authController.logout);

export default router;
