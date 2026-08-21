import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const mailOptions = {
    from: `Cotram <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (
  email: string,
  token: string,
  name: string,
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
        <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f2cb04; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #f2cb04; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #000; margin: 0;">Cotram</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${escapeHtml(name)},</h2>
            <p>Merci de vous être inscrit sur Cotram !</p>
            <p>Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </div>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>Ce lien expire dans 24 heures.</strong></p>
            <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Cotram - Coopérative de Transport</p>
            <p>Antananarivo - Antsirabe - Ambatolampy</p>
          </div>
        </div>
      </body>
    </html>
    `;

  await sendEmail({
    to: email,
    subject: "Vérification de votre adresse email - Cotram",
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  name: string,
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f2cb04; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #f2cb04; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #000; margin: 0;">Cotram</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${escapeHtml(name)},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>Ce lien expire dans 1 heure.</strong></p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Cotram - Coopérative de Transport</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe - Cotram",
    html,
  });
};

export const sendReservationConfirmation = async (
  email: string,
  name: string,
  bookingReference: string,
  details: {
    departure: string;
    destination: string;
    date: string;
    time: string;
    seats: number[];
    totalPrice: number;
  },
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f2cb04; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .booking-details { background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #f2cb04; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #000; margin: 0;">Cotram</h1>
            <p style="color: #000; margin: 5px 0;">Confirmation de réservation</p>
          </div>
          <div class="content">
            <h2>Bonjour ${escapeHtml(name)},</h2>
            <p>Votre réservation a été confirmée avec succès !</p>
            <div class="booking-details">
              <h3>Référence : <strong>${escapeHtml(bookingReference)}</strong></h3>
              <div class="detail-row">
                <span>Départ :</span>
                <strong>${escapeHtml(details.departure)}</strong>
              </div>
              <div class="detail-row">
                <span>Destination :</span>
                <strong>${escapeHtml(details.destination)}</strong>
              </div>
              <div class="detail-row">
                <span>Date :</span>
                <strong>${details.date}</strong>
              </div>
              <div class="detail-row">
                <span>Heure :</span>
                <strong>${details.time}</strong>
              </div>
              <div class="detail-row">
                <span>Sièges :</span>
                <strong>${details.seats.join(", ")}</strong>
              </div>
              <div class="detail-row" style="border-bottom: none; font-size: 18px;">
                <span>Total :</span>
                <strong style="color: #f2cb04;">${details.totalPrice.toLocaleString()} Ar</strong>
              </div>
            </div>
            <p><strong>Important :</strong> Présentez-vous à la gare 15 minutes avant le départ avec cette référence.</p>
            <p>Bon voyage avec Cotram !</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Cotram - Coopérative de Transport</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Confirmation de réservation ${bookingReference} - Cotram`,
    html,
  });
};
