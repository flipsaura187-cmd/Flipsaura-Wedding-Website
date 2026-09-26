import nodemailer from "nodemailer";

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST) {
    console.warn("[mailer] SMTP not configured, skipping:", subject);
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || "FlipsAura <no-reply@flipsaura.com>";
  return getTransporter().sendMail({ from, to, subject, html, text });
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
