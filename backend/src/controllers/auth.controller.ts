import crypto from "crypto";
import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../config/email.js";
import User from "../models/user.model.js";

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response,
): void => {
  const token = signToken(user._id.toString());

  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: true,
        errors: errors.array(),
      });
      return;
    }

    const { name, email, phone, password } = req.body;

    const userExists = await User.findOne({
      $or: [{ email }, ...(phone ? [{ phone }] : [])],
    });

    if (userExists) {
      res.status(400).json({
        success: false,
        message: "Email ou téléphone déjà utilisé",
      });
      return;
    }

    const user = await User.create({ name, email, phone, password });

    //Generate token et send email
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (error) {
      console.error("Erreur envoi email: ", error);
    }

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    console.log(error);
    let messages;

    if (error.name === "ValidationError") {
      messages = Object.values(error.errors).map((err: any) => err.message);
    } else {
      messages = (error as Error).message;
    }

    res.status(500).json({
      success: false,
      message: messages,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select("+password");

    if (!user || !user.password || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const googleAuthCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = req.user as any;
  const token = signToken(user._id.toString());

  // Rediriger vers le frontend avec le token en query param
  res.redirect(
    `${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`,
  );
};

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Token invalide ou expiré",
      });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Email vérifié avec succès",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Aucun utilisateur avec cet email",
      });
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      res.json({
        success: true,
        message: "Email de réinitialisation envoyé",
      });
    } catch (error) {
      user.passwordResetToken = "";
      user.passwordResetExpires = new Date(Date.now());
      await user.save();

      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Token invalide ou expiré",
      });
      return;
    }

    user.password = password;
    user.passwordResetToken = "undefined";
    user.passwordResetExpires = new Date(Date.now() - 7);
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({ success: true, message: "Déconnexion réussie" });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    user: req.user,
  });
};
