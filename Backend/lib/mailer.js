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
                    <strong>Notice:</strong> If you did not request a password reset, no action is needed and your account remains completely secure.
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

export function bookingConfirmationHtml({
  name,
  itemTitle,
  bookingId,
  eventDate,
  amount,
  status = "paid",
  paymentId = "",
  notes = "",
  phone = "",
  vendorName = "",
  vendorPhone = "",
}) {
  const isPaid = status === "paid";
  const formattedAmount =
    amount !== undefined && amount !== null
      ? `₹${Number(amount).toLocaleString("en-IN")}`
      : "—";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - FlipsAura</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D2D2D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF8F5;padding:30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);border:1px solid #F0E6DE;" cellspacing="0" cellpadding="0">
            <!-- Header Banner -->
            <tr>
              <td style="background:linear-gradient(135deg,#8B1E3F 0%,#B83258 100%);padding:32px 28px;text-align:center;color:#ffffff;">
                <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:1px;color:#FFFFFF;text-transform:uppercase;">FLIPSAURA</h1>
                <p style="margin:8px 0 0;font-size:14px;color:#FDE8EE;letter-spacing:0.5px;font-weight:500;">
                  ${isPaid ? "🎉 Payment Received & Booking Confirmed!" : "Booking Received"}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1A1A1A;">
                  Dear <strong>${name || "Customer"}</strong>,
                </p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555555;">
                  ${
                    isPaid
                      ? "Thank you for booking with FlipsAura! Your payment has been successfully processed and your booking is confirmed with the vendor."
                      : "Thank you for choosing FlipsAura. We have received your booking details."
                  }
                </p>

                <!-- Highlight Box: Event Date & Booking ID -->
                <div style="background:#FFF5F8;border:1px solid #FFD0E2;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align:top;width:50%;">
                        <span style="font-size:11px;font-weight:700;color:#B32A68;text-transform:uppercase;letter-spacing:0.5px;display:block;">Booking ID</span>
                        <span style="font-size:15px;font-weight:800;color:#2A1726;display:block;margin-top:2px;">#${bookingId}</span>
                      </td>
                      <td style="vertical-align:top;width:50%;">
                        <span style="font-size:11px;font-weight:700;color:#B32A68;text-transform:uppercase;letter-spacing:0.5px;display:block;">Event / Stay Date</span>
                        <span style="font-size:15px;font-weight:800;color:#2A1726;display:block;margin-top:2px;">📅 ${eventDate || "To be scheduled"}</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Details Table -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:24px;font-size:13px;">
                  <tr style="border-bottom:1px solid #F3EAE3;">
                    <td style="padding:10px 0;color:#7A6470;font-weight:600;width:38%;">Service / Property</td>
                    <td style="padding:10px 0;color:#2A1726;font-weight:700;text-align:right;">${itemTitle || "Service"}</td>
                  </tr>
                  ${
                    notes
                      ? `<tr style="border-bottom:1px solid #F3EAE3;">
                          <td style="padding:10px 0;color:#7A6470;font-weight:600;">Selected Option / Notes</td>
                          <td style="padding:10px 0;color:#2A1726;text-align:right;">${notes}</td>
                        </tr>`
                      : ""
                  }
                  <tr style="border-bottom:1px solid #F3EAE3;">
                    <td style="padding:10px 0;color:#7A6470;font-weight:600;">Amount Paid</td>
                    <td style="padding:10px 0;color:#B32A68;font-weight:800;font-size:16px;text-align:right;">${formattedAmount}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #F3EAE3;">
                    <td style="padding:10px 0;color:#7A6470;font-weight:600;">Payment Status</td>
                    <td style="padding:10px 0;color:#059669;font-weight:700;text-align:right;">
                      ${isPaid ? "✓ Paid via Razorpay" : "Pending"}
                    </td>
                  </tr>
                  ${
                    paymentId
                      ? `<tr style="border-bottom:1px solid #F3EAE3;">
                          <td style="padding:10px 0;color:#7A6470;font-weight:600;">Payment Transaction ID</td>
                          <td style="padding:10px 0;color:#555555;font-family:monospace;font-size:12px;text-align:right;">${paymentId}</td>
                        </tr>`
                      : ""
                  }
                  ${
                    vendorName
                      ? `<tr style="border-bottom:1px solid #F3EAE3;">
                          <td style="padding:10px 0;color:#7A6470;font-weight:600;">Vendor / Host</td>
                          <td style="padding:10px 0;color:#2A1726;text-align:right;">${vendorName} ${vendorPhone ? `(${vendorPhone})` : ""}</td>
                        </tr>`
                      : ""
                  }
                </table>

                <div style="background:#FAF8F5;border-radius:10px;padding:14px 16px;margin-bottom:24px;border:1px solid #EFEAE5;">
                  <p style="margin:0;font-size:13px;line-height:1.5;color:#666666;">
                    <strong>Need assistance with your booking?</strong> Contact our 24x7 wedding coordination team at <a href="mailto:flipsaura187@gmail.com" style="color:#B32A68;text-decoration:none;font-weight:600;">flipsaura187@gmail.com</a> or WhatsApp <a href="https://wa.me/916202442499" style="color:#B32A68;text-decoration:none;font-weight:600;">+91 6202442499</a>.
                  </p>
                </div>

                <p style="margin:0;font-size:13px;color:#888888;">
                  Warm regards,<br>
                  <strong style="color:#8B1E3F;">Team FlipsAura</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#FDF9F6;padding:20px 28px;text-align:center;border-top:1px solid #F0E6DE;">
                <p style="margin:0;font-size:12px;color:#999999;">
                  &copy; ${new Date().getFullYear()} FlipsAura. All rights reserved. | Bihar's Premier Wedding Platform
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

export function adminBookingAlertHtml({ booking, item, vendor }) {
  const customerName = booking?.name || "Customer";
  const customerPhone = booking?.phone || "N/A";
  const customerEmail = booking?.email || "N/A";
  const itemTitle = item?.title || "Booked Service";
  const bookingId = String(booking?._id || "N/A");
  const eventDate = booking?.eventDate || "Not specified";
  const amountStr =
    booking?.amount !== undefined
      ? `₹${Number(booking.amount).toLocaleString("en-IN")}`
      : "—";
  const paymentId = booking?.payment?.paymentId || "N/A";
  const orderId = booking?.payment?.orderId || "N/A";
  const vendorName =
    vendor?.vendorProfile?.businessName ||
    vendor?.vendorProfile?.ownerName ||
    vendor?.name ||
    "Partner";
  const vendorPhone =
    vendor?.phone ||
    vendor?.vendorProfile?.ownerPhone ||
    vendor?.vendorProfile?.phone ||
    item?.contactPhone ||
    "";

  const cleanPhone = String(customerPhone).replace(/\D/g, "");
  const waLink = cleanPhone
    ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
        `Hi ${customerName}! This is FlipsAura Admin regarding your booking #${bookingId} for ${itemTitle} on ${eventDate}.`
      )}`
    : "";

  const cleanVendorPhone = String(vendorPhone).replace(/\D/g, "");
  const vendorWaLink = cleanVendorPhone
    ? `https://wa.me/91${cleanVendorPhone.slice(-10)}?text=${encodeURIComponent(
        `Hi ${vendorName}! FlipsAura Admin here. A new paid booking (#${bookingId}) has been received for ${itemTitle} on ${eventDate}.\nGuest: ${customerName} (${customerPhone})\nAmount: ${amountStr}. Please keep the reservation confirmed!`
      )}`
    : "";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Paid Booking Alert - FlipsAura Admin</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D2D2D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF8F5;padding:30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);border:1px solid #F0E6DE;" cellspacing="0" cellpadding="0">
            <!-- Header Banner -->
            <tr>
              <td style="background:linear-gradient(135deg,#047857 0%,#059669 100%);padding:28px;text-align:center;color:#ffffff;">
                <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:inline-block;margin-bottom:8px;">
                  🔔 ADMIN NOTIFICATION
                </span>
                <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#FFFFFF;">
                  New Paid Booking Received!
                </h1>
                <p style="margin:6px 0 0;font-size:14px;color:#D1FAE5;">
                  ${customerName} paid ${amountStr} for ${itemTitle}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px;">
                <!-- 1-Click Quick Actions for Admin -->
                <div style="text-align:center;margin-bottom:24px;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">
                  ${
                    waLink
                      ? `<a href="${waLink}" target="_blank" style="background:#25D366;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:50px;font-size:13px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(37,211,102,0.35);margin:4px;">
                          💬 WhatsApp Customer (${customerPhone})
                        </a>`
                      : ""
                  }
                  ${
                    vendorWaLink
                      ? `<a href="${vendorWaLink}" target="_blank" style="background:#0F766E;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:50px;font-size:13px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(15,118,110,0.35);margin:4px;">
                          🏨 WhatsApp Vendor (${vendorPhone})
                        </a>`
                      : ""
                  }
                </div>

                <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #F0E6DE;padding-bottom:6px;">
                  Customer Information
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;font-size:14px;">
                  <tr><td style="padding:4px 0;color:#7A6470;width:35%;">Name:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${customerName}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Phone:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${customerPhone}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Email:</td><td style="padding:4px 0;color:#1A1A1A;">${customerEmail}</td></tr>
                  ${
                    booking?.address
                      ? `<tr><td style="padding:4px 0;color:#7A6470;">Address:</td><td style="padding:4px 0;color:#1A1A1A;">${booking.address}</td></tr>`
                      : ""
                  }
                </table>

                <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #F0E6DE;padding-bottom:6px;">
                  Booking & Schedule Details
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;font-size:14px;">
                  <tr><td style="padding:4px 0;color:#7A6470;width:35%;">Booking ID:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">#${bookingId}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Service / Property:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${itemTitle}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Vendor / Partner:</td><td style="padding:4px 0;color:#1A1A1A;"><strong>${vendorName}</strong> ${vendorPhone ? `(${vendorPhone})` : ""}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Event / Stay Date:</td><td style="padding:4px 0;font-weight:800;color:#047857;font-size:15px;">📅 ${eventDate}</td></tr>
                  ${
                    booking?.notes
                      ? `<tr><td style="padding:4px 0;color:#7A6470;">Notes / Room:</td><td style="padding:4px 0;color:#1A1A1A;">${booking.notes}</td></tr>`
                      : ""
                  }
                </table>

                <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #F0E6DE;padding-bottom:6px;">
                  Payment Information
                </h3>
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;font-size:14px;">
                  <tr><td style="padding:4px 0;color:#7A6470;width:35%;">Amount Received:</td><td style="padding:4px 0;font-weight:800;color:#047857;font-size:18px;">${amountStr}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Razorpay Payment ID:</td><td style="padding:4px 0;font-family:monospace;color:#1A1A1A;">${paymentId}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Order ID:</td><td style="padding:4px 0;font-family:monospace;color:#1A1A1A;">${orderId}</td></tr>
                </table>

                <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;font-size:12px;color:#92400E;line-height:1.5;">
                  <strong>WhatsApp Delivery Note:</strong> If automatic WhatsApp delivery to the vendor, customer, or admin is paused due to an expired FireClashPro gateway session, use the green and teal buttons above to contact the Customer or Vendor in 1 click.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#FDF9F6;padding:16px 28px;text-align:center;border-top:1px solid #F0E6DE;">
                <p style="margin:0;font-size:12px;color:#999999;">
                  FlipsAura Administrator Internal Dispatch
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

export function vendorBookingAlertHtml({ booking, item, vendor }) {
  const customerName = booking?.name || "Customer";
  const customerPhone = booking?.phone || "N/A";
  const itemTitle = item?.title || "Your Service / Room";
  const bookingId = String(booking?._id || "N/A");
  const eventDate = booking?.eventDate || "Not specified";
  const amountStr =
    booking?.amount !== undefined
      ? `₹${Number(booking.amount).toLocaleString("en-IN")}`
      : "—";
  const vendorName =
    vendor?.vendorProfile?.businessName ||
    vendor?.vendorProfile?.ownerName ||
    vendor?.name ||
    "Partner";

  const cleanCustPhone = String(customerPhone).replace(/\D/g, "");
  const waCustLink = cleanCustPhone
    ? `https://wa.me/91${cleanCustPhone.slice(-10)}?text=${encodeURIComponent(
        `Hi ${customerName}! This is ${vendorName} regarding your FlipsAura booking #${bookingId} for ${itemTitle} on ${eventDate}.`
      )}`
    : "";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Confirmed - FlipsAura Vendor</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2D2D2D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF8F5;padding:30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);border:1px solid #F0E6DE;" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background:linear-gradient(135deg,#0F766E 0%,#0D9488 100%);padding:28px;text-align:center;color:#ffffff;">
                <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:inline-block;margin-bottom:8px;">
                  🏨 VENDOR NOTIFICATION
                </span>
                <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#FFFFFF;">
                  New Paid Booking Confirmed!
                </h1>
                <p style="margin:6px 0 0;font-size:14px;color:#CCFBF1;">
                  A guest has booked ${itemTitle} for ${eventDate}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${
                  waCustLink
                    ? `<div style="text-align:center;margin-bottom:24px;">
                        <a href="${waCustLink}" target="_blank" style="background:#25D366;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:50px;font-size:14px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(37,211,102,0.35);">
                          💬 WhatsApp Customer Directly (${customerPhone})
                        </a>
                      </div>`
                    : ""
                }
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;font-size:14px;">
                  <tr><td style="padding:4px 0;color:#7A6470;width:35%;">Booking ID:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">#${bookingId}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Service / Room:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${itemTitle}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Guest Name:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${customerName}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Guest Phone:</td><td style="padding:4px 0;font-weight:700;color:#1A1A1A;">${customerPhone}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Event Date:</td><td style="padding:4px 0;font-weight:800;color:#0F766E;font-size:15px;">📅 ${eventDate}</td></tr>
                  <tr><td style="padding:4px 0;color:#7A6470;">Amount:</td><td style="padding:4px 0;font-weight:800;color:#0F766E;">${amountStr} (Paid)</td></tr>
                  ${
                    booking?.notes
                      ? `<tr><td style="padding:4px 0;color:#7A6470;">Special Requests:</td><td style="padding:4px 0;color:#1A1A1A;">${booking.notes}</td></tr>`
                      : ""
                  }
                </table>
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

