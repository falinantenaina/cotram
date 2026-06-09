import type { Request, Response } from "express";
import { sendEmail } from "../config/email.js";

export const sendContactMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({
        success: false,
        message: "Nom, email et message sont requis",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Email invalide",
      });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f2cb04; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
            .value { margin-top: 5px; padding: 10px; background: #fff; border-radius: 6px; border: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #000; margin: 0;">Cotram</h1>
              <p style="color: #000; margin: 5px 0;">Nouveau message de contact</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nom</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value">${email}</div>
              </div>
              ${subject ? `
              <div class="field">
                <div class="label">Sujet</div>
                <div class="value">${subject}</div>
              </div>
              ` : ""}
              <div class="field">
                <div class="label">Message</div>
                <div class="value">${message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Cotram - Coopérative de Transport</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
      subject: `[Contact] ${subject || "Nouveau message"} - ${name}`,
      html,
    });

    res.json({
      success: true,
      message: "Message envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur envoi contact:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du message",
    });
  }
};
