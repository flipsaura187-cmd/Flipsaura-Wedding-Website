import "dotenv/config";
import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || "").trim();

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  if (!host) {
    console.warn("[mailer] SMTP not configured, skipping:", subject);
    return { skipped: true };
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `FlipsAura <${process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@flipsaura.com"}>`;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  console.log(`[mailer] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
  return info;
}

export function passwordResetHtml({ name, resetUrl }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - FlipsAura</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D2D2D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF8F5;padding:40px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #F0E6DE;" cellspacing="0" cellpadding="0">
            <!-- Header Banner -->
            <tr>
              <td style="background:linear-gradient(135deg,#8B1E3F 0%,#B83258 100%);padding:36px 32px;text-align:center;">
                <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:1px;color:#FFFFFF;text-transform:uppercase;">FLIPSAURA</h1>
                <p style="margin:8px 0 0;font-size:13px;color:#FDE8EE;letter-spacing:0.5px;">Your Wedding. Your Marketplace.</p>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="padding:36px 32px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A1A;font-weight:600;">Password Reset Request</h2>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#555555;">
                  Hello ${name ? name : ""},
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#555555;">
                  We received a request to reset the password for your FlipsAura account. Click the button below to choose a new password:
                </p>

                <!-- CTA Button -->
                <div style="text-align:center;margin:32px 0;">
                  <a href="${resetUrl}" target="_blank" style="background:#8B1E3F;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:15px;font-weight:600;border-radius:50px;display:inline-block;box-shadow:0 4px 12px rgba(139,30,63,0.3);letter-spacing:0.3px;">
                    Reset Password
                  </a>
                </div>

                <div style="background:#FFF9F6;border-left:4px solid #D4AF37;padding:14px 18px;border-radius:6px;margin:28px 0;">
                  <p style="margin:0;font-size:13px;line-height:1.5;color:#855F10;">
                    <strong>Security Notice:</strong> This link will expire in <strong>1 hour</strong>. If you did not request a password reset, no action is needed and your account remains completely secure.
                  </p>
                </div>

                <p style="margin:24px 0 8px;font-size:13px;color:#888888;">
                  If the button above doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;color:#8B1E3F;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#8B1E3F;text-decoration:underline;">${resetUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#FDF9F6;padding:24px 32px;text-align:center;border-top:1px solid #F0E6DE;">
                <p style="margin:0;font-size:12px;color:#999999;">
                  &copy; ${new Date().getFullYear()} FlipsAura. All rights reserved.
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:#AAAAAA;">
                  Curating beautiful weddings with love and elegance.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function sendPasswordResetMail({ to, name, resetUrl }) {
  const subject = "Reset your FlipsAura password";
  const html = passwordResetHtml({ name, resetUrl });
  const text = `Hello ${name || ""},\n\nYou recently requested to reset your password for FlipsAura.\n\nPlease use the following link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\n— Team FlipsAura`;

  return sendMail({ to, subject, html, text });
}

export function bookingConfirmationHtml({ name, itemTitle, bookingId, eventDate, amount, status }) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border:1px solid #f3d9e4;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#ff7eb6,#ffd6e7);padding:24px;color:#fff">
      <h1 style="margin:0;font-size:22px">FlipsAura</h1>
      <p style="margin:6px 0 0">Booking ${status === "paid" ? "Confirmed" : "Received"}</p>
    </div>
    <div style="padding:24px;color:#333">
      <p>Hi ${name || "there"},</p>
      <p>Thanks for booking with FlipsAura.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#888">Booking ID</td><td><b>${bookingId}</b></td></tr>
        <tr><td style="padding:6px 0;color:#888">Item</td><td>${itemTitle}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Event Date</td><td>${eventDate || "-"}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Amount</td><td>₹${amount}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Status</td><td>${status}</td></tr>
      </table>
      <p>Our team will reach out shortly to coordinate.</p>
      <p style="color:#a85a7a">— Team FlipsAura</p>
    </div>
  </div>`;
}
