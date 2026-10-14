/**
 * WhatsApp Gateway Integration for FlipsAura
 * Provider: FireClashPro (waapi.fireclashpro.com)
 */

export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  // Strip all non-digit characters
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

export function maskPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  const last4 = cleaned.slice(-4);
  return `+91 ******${last4}`;
}

export async function sendWhatsAppOtp(phone, otp) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      success: false,
      error: "Invalid mobile number format for WhatsApp delivery",
    };
  }

  const apiUrl =
    process.env.WHATSAPP_API_URL ||
    "https://waapi.fireclashpro.com/api/v1/messages/send";
  const apiKey = (
    process.env.WHATSAPP_API_KEY ||
    process.env.WHATSAPP_APIKEY ||
    "wag_live_j0BE5HDq_CUAvG-q5IkeHaED3CJyC-YmUvSaF43mktk"
  ).trim();
  const sessionId = (
    process.env.WHATSAPP_SESSION_ID ||
    process.env.WHATSAPP_SESSIONID ||
    "8930779"
  ).trim();

  const messageText = `*FlipsAura Account Verification*\n\nYour 6-digit verification code is: *${otp}*\n\nThis OTP is valid for 10 minutes. Please enter this code to complete your signup.\n\n_Note: Please do not share this OTP with anyone._\n\nThank you,\nTeam FlipsAura`;

  // Always log OTP to server console for testing & fallback
  console.log(`\n======================================================`);
  console.log(`[WhatsApp OTP Dispatch]`);
  console.log(`To Phone     : ${phone} (Normalized: ${normalizedPhone})`);
  console.log(`Generated OTP: ${otp}`);
  console.log(`======================================================\n`);

  if (!apiKey || !sessionId) {
    console.warn(
      "[WhatsApp Gateway] WHATSAPP_API_KEY or WHATSAPP_SESSION_ID is not configured in .env"
    );
    return {
      success: false,
      devOtp: otp,
      error: "WhatsApp gateway credentials not configured.",
    };
  }

  try {
    const payload = {
      session_id: sessionId,
      recipient: normalizedPhone,
      message: messageText,
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

    if (response.ok && (data.status === "SENT" || data.status === "queued" || data.success === true)) {
      console.log(`[WhatsApp Gateway] Successfully queued/sent OTP to ${normalizedPhone}`);
      return { success: true, data };
    }

    if (data.error?.code === "SESSION_NOT_CONNECTED") {
      console.warn(
        `[WhatsApp Gateway Warning] Session ${sessionId} is not connected on FireClashPro. Please scan QR code in fireclashpro.com dashboard.`
      );
      return {
        success: false,
        sessionNotConnected: true,
        error: "WhatsApp session is not connected. Please scan QR code on FireClashPro dashboard.",
        devOtp: otp,
      };
    }

    console.warn("[WhatsApp Gateway Error]", data);
    return {
      success: false,
      error: data.error?.message || "Failed to send WhatsApp message",
      devOtp: otp,
    };
  } catch (error) {
    console.error("[WhatsApp Gateway Exception]", error.message);
    return {
      success: false,
      error: error.message,
      devOtp: otp,
    };
  }
}
