/**
 * WhatsApp Gateway Integration for FlipsAura
 * Supports Meta WhatsApp Cloud API (official), FireClashPro, Twilio, and Test/Mock mode.
 */

import { dbConnect } from "./db.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

/**
 * Normalizes phone numbers into E.164-compatible digits format.
 * Defaults 10-digit Indian numbers with country code "91".
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  let digits = rawPhone.replace(/\D/g, "");

  // Remove leading 0 if present (common in Indian mobile numbers like 09876543210)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If 10 digits (standard Indian mobile number without country code), prepend 91
  if (digits.length === 10) {
    digits = "91" + digits;
  }

  return digits;
}

/**
 * Safely masks a phone number for logging without exposing full customer/admin PII.
 * Example: "919876543210" -> "+91 ******3210"
 */
export function maskPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  const last4 = cleaned.slice(-4);
  const prefix = cleaned.length > 4 ? `+${cleaned.slice(0, 2)} ` : "";
  return `${prefix}******${last4}`;
}

/**
 * Detects the active WhatsApp provider based on environment configuration.
 */
export function getWhatsAppProvider() {
  const provider = (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase();
  if (provider) return provider;

  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return "meta";
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return "twilio";
  }

  if (process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_SESSION_ID) {
    return "fireclashpro";
  }

  return "fireclashpro";
}

/**
 * Formats WhatsApp notification text for Admin when a new booking is created.
 */
export function formatAdminBookingWhatsAppMessage(booking, item, vendor) {
  const bookingId = String(booking?._id || "N/A");
  const customerName = booking?.name || "Valued Customer";
  const customerPhone = booking?.phone || "N/A";
  const serviceName = item?.title || "Booked Service";
  const categoryName = item?.category?.name || "";
  const vendorName =
    vendor?.vendorProfile?.businessName ||
    vendor?.vendorProfile?.ownerName ||
    vendor?.name ||
    "";
  const bookingDate =
    booking?.eventDate ||
    (booking?.createdAt
      ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A");
  const bookingStatus = booking?.status || "pending";
  const amountStr =
    booking?.amount !== undefined
      ? `₹${Number(booking.amount).toLocaleString("en-IN")}`
      : "";

  let msg = `*New Booking Received — FlipsAura!*\n\n`;
  msg += `*Booking ID:* ${bookingId}\n`;
  msg += `*Customer:* ${customerName}\n`;
  msg += `*Phone:* ${customerPhone}\n`;
  msg += `*Service:* ${serviceName}${categoryName ? ` (${categoryName})` : ""}\n`;
  if (vendorName) {
    msg += `*Vendor:* ${vendorName}\n`;
  }
  msg += `*Date:* ${bookingDate}\n`;
  if (amountStr) {
    msg += `*Amount:* ${amountStr}\n`;
  }
  msg += `*Status:* ${bookingStatus}\n`;
  if (booking?.notes) {
    msg += `*Notes:* ${booking.notes}\n`;
  }
  if (booking?.address) {
    msg += `*Address:* ${booking.address}\n`;
  }
  msg += `\nPlease check the admin dashboard for more details.`;
  return msg;
}

/**
 * Formats WhatsApp confirmation text for Customer when their booking is created.
 */
export function formatCustomerBookingWhatsAppMessage(booking, item, vendor) {
  const customerName = booking?.name || "Customer";
  const bookingId = String(booking?._id || "N/A");
  const serviceName = item?.title || "Booked Service";
  const bookingDate =
    booking?.eventDate ||
    (booking?.createdAt
      ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A");
  const bookingStatus = booking?.status || "pending";
  const vendorName =
    vendor?.vendorProfile?.businessName ||
    vendor?.vendorProfile?.ownerName ||
    vendor?.name ||
    "";
  const amountStr =
    booking?.amount !== undefined
      ? `₹${Number(booking.amount).toLocaleString("en-IN")}`
      : "";

  let msg = `Hi ${customerName}!\n\n`;
  msg += `Thank you for choosing FlipsAura. Your booking has been received successfully.\n\n`;
  msg += `*Booking ID:* ${bookingId}\n`;
  msg += `*Service:* ${serviceName}\n`;
  if (vendorName) {
    msg += `*Vendor:* ${vendorName}\n`;
  }
  msg += `*Date:* ${bookingDate}\n`;
  if (amountStr) {
    msg += `*Amount:* ${amountStr}\n`;
  }
  msg += `*Status:* ${bookingStatus}\n\n`;
  msg += `We will keep you updated about your booking.\n\n`;
  msg += `Thank you for choosing FlipsAura!`;
  return msg;
}

/**
 * Sends a generic WhatsApp message via the configured provider.
 */
export async function sendWhatsAppMessage({
  to,
  text,
  templateName,
  templateLanguage = "en_US",
  templateComponents = [],
}) {
  const normalizedPhone = normalizePhoneNumber(to);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      success: false,
      error: "Invalid phone number format for WhatsApp delivery",
    };
  }

  const provider = getWhatsAppProvider();
  const maskedRecipient = maskPhoneNumber(normalizedPhone);

  // 1. Mock / Test provider
  if (provider === "mock") {
    console.log(`[WhatsApp Mock Dispatch] Recipient: ${maskedRecipient}`);
    console.log(`[WhatsApp Mock Content] ${text.replace(/\n/g, " ")}`);
    return {
      success: true,
      provider: "mock",
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      mocked: true,
    };
  }

  // 2. Unconfigured provider
  if (provider === "unconfigured") {
    console.warn(
      `[WhatsApp Gateway] No active WhatsApp credentials configured in environment. Skipping delivery to ${maskedRecipient}.`
    );
    return {
      success: false,
      unconfigured: true,
      error: "WhatsApp gateway credentials not configured in environment.",
    };
  }

  // 3. Meta WhatsApp Cloud API (Official WhatsApp Business Platform)
  if (provider === "meta") {
    const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();

    if (!accessToken || !phoneNumberId) {
      console.warn(
        "[WhatsApp Cloud API] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in environment"
      );
      return {
        success: false,
        error: "Missing Meta WhatsApp Cloud API credentials",
      };
    }

    const apiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    let payload;
    if (templateName) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: templateComponents,
        },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "text",
        text: { preview_url: false, body: text },
      };
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.messages?.[0]?.id) {
        console.log(
          `[WhatsApp Cloud API] Message dispatched successfully to ${maskedRecipient} (ID: ${data.messages[0].id})`
        );
        return {
          success: true,
          provider: "meta",
          messageId: data.messages[0].id,
          data,
        };
      }

      console.warn(
        `[WhatsApp Cloud API Error] Delivery failed to ${maskedRecipient}:`,
        data?.error?.message || response.statusText
      );
      return {
        success: false,
        provider: "meta",
        error: data?.error?.message || "Failed to deliver WhatsApp message via Meta Cloud API",
        data,
      };
    } catch (err) {
      console.error(
        `[WhatsApp Cloud API Exception] Delivery error to ${maskedRecipient}:`,
        err.message
      );
      return {
        success: false,
        provider: "meta",
        error: err.message,
      };
    }
  }

  // 4. Twilio WhatsApp API
  if (provider === "twilio") {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const twilioFromNumber = (process.env.TWILIO_WHATSAPP_NUMBER || "").trim();

    if (!accountSid || !authToken || !twilioFromNumber) {
      console.warn("[Twilio WhatsApp] Missing Twilio credentials in environment");
      return {
        success: false,
        error: "Missing Twilio WhatsApp credentials",
      };
    }

    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("From", twilioFromNumber.startsWith("whatsapp:") ? twilioFromNumber : `whatsapp:${twilioFromNumber}`);
    formData.append("To", `whatsapp:+${normalizedPhone}`);
    formData.append("Body", text);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.sid) {
        console.log(
          `[Twilio WhatsApp] Message dispatched successfully to ${maskedRecipient} (SID: ${data.sid})`
        );
        return {
          success: true,
          provider: "twilio",
          messageId: data.sid,
          data,
        };
      }

      console.warn(
        `[Twilio WhatsApp Error] Delivery failed to ${maskedRecipient}:`,
        data?.message || response.statusText
      );
      return {
        success: false,
        provider: "twilio",
        error: data?.message || "Failed to deliver WhatsApp message via Twilio",
        data,
      };
    } catch (err) {
      console.error(
        `[Twilio WhatsApp Exception] Delivery error to ${maskedRecipient}:`,
        err.message
      );
      return {
        success: false,
        provider: "twilio",
        error: err.message,
      };
    }
  }

  // 5. FireClashPro Gateway (existing integration)
  const apiUrl =
    process.env.WHATSAPP_API_URL || "https://waapi.fireclashpro.com/api/v1/messages/send";
  const apiKey = (
    process.env.WHATSAPP_API_KEY ||
    process.env.WHATSAPP_APIKEY ||
    "wag_live_j0BE5HDq_CUAvG-q5IkeHaED3CJyC-YmUvSaF43mktk"
  ).trim();
  const sessionId = (
    process.env.WHATSAPP_SESSION_ID ||
    process.env.WHATSAPP_SESSIONID ||
    "2465351"
  ).trim();

  if (!apiKey || !sessionId) {
    console.warn(
      "[WhatsApp Gateway] WHATSAPP_API_KEY or WHATSAPP_SESSION_ID is not configured in .env"
    );
    return {
      success: false,
      error: "WhatsApp gateway credentials not configured.",
    };
  }

  try {
    const payload = {
      session_id: sessionId,
      recipient: normalizedPhone,
      message: text,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (
      response.ok &&
      (data.status === "SENT" || data.status === "queued" || data.success === true)
    ) {
      console.log(`[WhatsApp Gateway] Successfully queued/sent message to ${maskedRecipient}`);
      return {
        success: true,
        provider: "fireclashpro",
        messageId: data.id || data.message_id || "sent",
        data,
      };
    }

    if (data.error?.code === "SESSION_NOT_CONNECTED") {
      console.warn(
        `[WhatsApp Gateway Warning] Session ${sessionId} is not connected on FireClashPro. Please scan QR code in fireclashpro.com dashboard.`
      );
      return {
        success: false,
        provider: "fireclashpro",
        sessionNotConnected: true,
        error:
          "WhatsApp session is not connected. Please scan QR code on FireClashPro dashboard.",
      };
    }

    console.warn("[WhatsApp Gateway Error]", data?.error?.message || data);
    return {
      success: false,
      provider: "fireclashpro",
      error: data?.error?.message || "Failed to send WhatsApp message via FireClashPro",
      data,
    };
  } catch (error) {
    console.error("[WhatsApp Gateway Exception]", error.message);
    return {
      success: false,
      provider: "fireclashpro",
      error: error.message,
    };
  }
}

/**
 * Sends a WhatsApp OTP to a user for account or phone verification.
 * Preserves the exact signature and behavior expected across the application.
 */
export async function sendWhatsAppOtp(phone, otp) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      success: false,
      error: "Invalid mobile number format for WhatsApp delivery",
    };
  }

  const messageText = `*FlipsAura Account Verification*\n\nYour 6-digit verification code is: *${otp}*\n\nThis OTP is valid for 10 minutes. Please enter this code to complete your signup.\n\n_Note: Please do not share this OTP with anyone._\n\nThank you,\nTeam FlipsAura`;

  console.log(`\n======================================================`);
  console.log(`[WhatsApp OTP Dispatch]`);
  console.log(`To Phone     : ${maskPhoneNumber(phone)} (Normalized: ${maskPhoneNumber(normalizedPhone)})`);
  console.log(`Generated OTP: ${otp}`);
  console.log(`======================================================\n`);

  const result = await sendWhatsAppMessage({
    to: normalizedPhone,
    text: messageText,
    templateName: process.env.WHATSAPP_TEMPLATE_OTP || undefined,
  });

  return {
    ...result,
    devOtp: otp,
  };
}

/**
 * Sends a WhatsApp notification to the Admin for a newly created booking.
 */
export async function sendBookingAdminWhatsApp(booking, item, vendor) {
  const adminPhone =
    process.env.WHATSAPP_ADMIN_PHONE ||
    process.env.ADMIN_PHONE ||
    "";

  let targetPhone = adminPhone;

  // Fallback to searching an Admin user record in database if env phone not provided
  if (!targetPhone) {
    try {
      await dbConnect();
      const adminUser = await User.findOne({
        role: "admin",
        phone: { $exists: true, $ne: "" },
      })
        .select("phone")
        .lean();
      if (adminUser?.phone) {
        targetPhone = adminUser.phone;
      }
    } catch (e) {
      // Non-fatal lookup error
    }
  }

  if (!targetPhone) {
    console.warn(
      "[WhatsApp Notification] WHATSAPP_ADMIN_PHONE is not configured. Admin WhatsApp alert skipped."
    );
    return {
      success: false,
      error: "Admin phone number not configured in WHATSAPP_ADMIN_PHONE.",
    };
  }

  const messageText = formatAdminBookingWhatsAppMessage(booking, item, vendor);
  return sendWhatsAppMessage({
    to: targetPhone,
    text: messageText,
    templateName: process.env.WHATSAPP_TEMPLATE_ADMIN_BOOKING || undefined,
  });
}

/**
 * Sends a WhatsApp confirmation to the Customer for a newly created booking.
 */
export async function sendBookingCustomerWhatsApp(booking, item, vendor) {
  const customerPhone = booking?.phone;
  if (!customerPhone) {
    console.warn(
      `[WhatsApp Notification] No phone number recorded for booking ${booking?._id}. Customer WhatsApp confirmation skipped.`
    );
    return {
      success: false,
      error: "No customer phone number available on booking.",
    };
  }

  const messageText = formatCustomerBookingWhatsAppMessage(booking, item, vendor);
  return sendWhatsAppMessage({
    to: customerPhone,
    text: messageText,
    templateName: process.env.WHATSAPP_TEMPLATE_CUSTOMER_BOOKING || undefined,
  });
}

/**
 * Orchestrates WhatsApp notifications for a new booking:
 * - Persists and respects delivery status flags to prevent duplicates.
 * - Handles admin and customer notifications in complete isolation.
 * - Never throws or disrupts booking lifecycle.
 */
export async function sendBookingWhatsAppNotifications(bookingId) {
  if (!bookingId) return { success: false, error: "bookingId is required" };

  try {
    await dbConnect();
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "item",
        populate: { path: "category" },
      })
      .populate("vendor");

    if (!booking) {
      console.warn(`[WhatsApp Notification] Booking ${bookingId} not found`);
      return { success: false, error: "Booking not found" };
    }

    // Initialize notifications subdocument if missing
    if (!booking.notifications) {
      booking.notifications = {};
    }
    if (!booking.notifications.adminWhatsApp) {
      booking.notifications.adminWhatsApp = { sent: false };
    }
    if (!booking.notifications.customerWhatsApp) {
      booking.notifications.customerWhatsApp = { sent: false };
    }

    // Avoid duplicate dispatch if already completed
    if (
      booking.notifications.adminWhatsApp.sent &&
      booking.notifications.customerWhatsApp.sent
    ) {
      console.log(
        `[WhatsApp Notification] Notifications already sent for booking ${bookingId}. Skipping duplicate dispatch.`
      );
      return {
        success: true,
        skipped: true,
        admin: booking.notifications.adminWhatsApp,
        customer: booking.notifications.customerWhatsApp,
      };
    }

    const item = booking.item;
    const vendor = booking.vendor;

    // 1. Dispatch Admin Notification (isolated)
    let adminResult = null;
    if (!booking.notifications.adminWhatsApp.sent) {
      try {
        adminResult = await sendBookingAdminWhatsApp(booking, item, vendor);
        if (adminResult.success) {
          booking.notifications.adminWhatsApp = {
            sent: true,
            sentAt: new Date(),
            messageId: String(adminResult.messageId || "sent"),
            error: "",
          };
        } else {
          booking.notifications.adminWhatsApp = {
            sent: false,
            sentAt: null,
            messageId: "",
            error: String(adminResult.error || "Failed to send"),
          };
        }
      } catch (err) {
        console.error("[WhatsApp Admin Notification Exception]", err.message);
        booking.notifications.adminWhatsApp = {
          sent: false,
          sentAt: null,
          messageId: "",
          error: err.message,
        };
      }
    }

    // 2. Dispatch Customer Notification (isolated)
    let customerResult = null;
    if (!booking.notifications.customerWhatsApp.sent) {
      try {
        customerResult = await sendBookingCustomerWhatsApp(booking, item, vendor);
        if (customerResult.success) {
          booking.notifications.customerWhatsApp = {
            sent: true,
            sentAt: new Date(),
            messageId: String(customerResult.messageId || "sent"),
            error: "",
          };
        } else {
          booking.notifications.customerWhatsApp = {
            sent: false,
            sentAt: null,
            messageId: "",
            error: String(customerResult.error || "Failed to send"),
          };
        }
      } catch (err) {
        console.error("[WhatsApp Customer Notification Exception]", err.message);
        booking.notifications.customerWhatsApp = {
          sent: false,
          sentAt: null,
          messageId: "",
          error: err.message,
        };
      }
    }

    // 3. Persist notification status back to database
    try {
      await booking.save();
    } catch (saveErr) {
      console.error("[WhatsApp] Failed to update booking notification flags:", saveErr.message);
    }

    return {
      success: true,
      admin: booking.notifications.adminWhatsApp,
      customer: booking.notifications.customerWhatsApp,
    };
  } catch (outerErr) {
    console.error("[WhatsApp Notification System Error]", outerErr.message);
    return {
      success: false,
      error: outerErr.message,
    };
  }
}
