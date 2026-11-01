/**
 * Twilio SMS & WhatsApp Verification Service for FlipsAura
 * Supports Twilio Verify API (carrier-compliant OTP delivery) and Twilio Messages API.
 */

import { maskPhoneNumber, normalizePhoneNumber } from "./whatsapp.js";

/**
 * Retrieves and validates Twilio credentials from environment variables.
 * Handles both UPPERCASE and PascalCase/CamelCase env variable naming.
 */
export function getTwilioConfig() {
  const accountSid = (
    process.env.TWILIO_ACCOUNT_SID ||
    process.env.Twilio_Account_SID ||
    process.env.twilio_account_sid ||
    ""
  ).trim();

  const authToken = (
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.Twilio_Auth_Token ||
    process.env.twilio_auth_token ||
    ""
  ).trim();

  const rawFromPhone = (
    process.env.TWILIO_PHONE_NUMBER ||
    process.env.Twilio_Phone_Number ||
    process.env.WHATSAPP_ADMIN_PHONE ||
    "916202442499"
  ).trim();

  const verifyServiceSid = (
    process.env.TWILIO_VERIFY_SERVICE_SID ||
    process.env.Twilio_Verify_Service_SID ||
    "VAb5b58d13ccf4a1264d21d2a05d4d7a3c"
  ).trim();

  const fromPhone = rawFromPhone.startsWith("+")
    ? rawFromPhone
    : `+${normalizePhoneNumber(rawFromPhone)}`;

  return {
    accountSid,
    authToken,
    fromPhone,
    verifyServiceSid,
    isConfigured: Boolean(accountSid && authToken),
  };
}

/**
 * Sends a verification OTP to a phone number using Twilio.
 * First tries Twilio Verify API (SMS channel).
 * If Twilio Messages API is preferred or Verify is unavailable, delivers SMS via Messages API.
 */
export async function sendTwilioOtp(phone, otp) {
  const config = getTwilioConfig();
  if (!config.isConfigured) {
    console.warn("[Twilio OTP] Twilio credentials (Account SID / Auth Token) not configured in .env");
    return {
      success: false,
      error: "Twilio credentials are not configured.",
    };
  }

  const rawNormalized = normalizePhoneNumber(phone);
  if (!rawNormalized || rawNormalized.length < 10) {
    return {
      success: false,
      error: "Invalid phone number format for OTP delivery.",
    };
  }

  const toE164 = `+${rawNormalized}`;
  const maskedPhone = maskPhoneNumber(rawNormalized);

  console.log(`\n======================================================`);
  console.log(`[Twilio OTP Dispatch]`);
  console.log(`Recipient  : ${maskedPhone} (${toE164})`);
  console.log(`Sender     : ${config.fromPhone}`);
  console.log(`Verify SID : ${config.verifyServiceSid || "N/A"}`);
  console.log(`Code (OTP) : ${otp}`);
  console.log(`======================================================\n`);

  const authHeader = `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`;

  // 1. Primary Method: Twilio Verify API (Carrier-compliant, zero DLT block in India)
  if (config.verifyServiceSid) {
    try {
      const verifyUrl = `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}/Verifications`;
      const params = new URLSearchParams();
      params.append("To", toE164);
      params.append("Channel", "sms");

      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.status === "pending" || data.status === "approved")) {
        console.log(`[Twilio Verify] OTP dispatched successfully to ${maskedPhone} (SID: ${data.sid})`);
        return {
          success: true,
          provider: "twilio_verify",
          serviceSid: config.verifyServiceSid,
          sid: data.sid,
          status: data.status,
          to: toE164,
        };
      }

      console.warn(`[Twilio Verify Warning] Code: ${data.code}, Message: ${data.message}. Trying Twilio Messages API fallback...`);
    } catch (err) {
      console.warn(`[Twilio Verify Exception]: ${err.message}. Trying Messages API fallback...`);
    }
  }

  // 2. Secondary Method: Twilio Messages API (SMS / WhatsApp)
  try {
    const messagesUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const messageBody = `FlipsAura: Your verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    const smsParams = new URLSearchParams();
    smsParams.append("From", config.fromPhone);
    smsParams.append("To", toE164);
    smsParams.append("Body", messageBody);

    const smsResponse = await fetch(messagesUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: smsParams.toString(),
    });

    const smsData = await smsResponse.json().catch(() => ({}));

    if (smsResponse.ok && smsData.sid) {
      console.log(`[Twilio SMS] Message dispatched to ${maskedPhone} (SID: ${smsData.sid})`);
      return {
        success: true,
        provider: "twilio_sms",
        messageId: smsData.sid,
        data: smsData,
      };
    }

    // 3. Try Twilio WhatsApp Channel if SMS returns an error
    console.warn(`[Twilio SMS Warning] ${smsData.message || smsResponse.statusText}. Trying Twilio WhatsApp...`);
    const waParams = new URLSearchParams();
    const fromWa = config.fromPhone.startsWith("whatsapp:")
      ? config.fromPhone
      : `whatsapp:${config.fromPhone}`;
    waParams.append("From", fromWa);
    waParams.append("To", `whatsapp:${toE164}`);
    waParams.append("Body", messageBody);

    const waResponse = await fetch(messagesUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: waParams.toString(),
    });

    const waData = await waResponse.json().catch(() => ({}));
    if (waResponse.ok && waData.sid) {
      console.log(`[Twilio WhatsApp] Message dispatched to ${maskedPhone} (SID: ${waData.sid})`);
      return {
        success: true,
        provider: "twilio_whatsapp",
        messageId: waData.sid,
        data: waData,
      };
    }

    console.error(`[Twilio Dispatch Failed] ${waData.message || smsData.message || "Twilio delivery error"}`);
    return {
      success: false,
      provider: "twilio",
      error: smsData.message || waData.message || "Failed to send OTP via Twilio.",
      code: smsData.code || waData.code,
    };
  } catch (err) {
    console.error("[Twilio Dispatch Exception]", err.message);
    return {
      success: false,
      provider: "twilio",
      error: err.message,
    };
  }
}

/**
 * Checks verification code against Twilio Verify API service.
 * Returns true if Twilio Verify approved the code.
 */
export async function verifyTwilioCode(phone, code) {
  const config = getTwilioConfig();
  if (!config.isConfigured || !config.verifyServiceSid) {
    return { approved: false, reason: "Twilio Verify not configured" };
  }

  const rawNormalized = normalizePhoneNumber(phone);
  const toE164 = `+${rawNormalized}`;
  const authHeader = `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`;

  try {
    const checkUrl = `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}/VerificationCheck`;
    const params = new URLSearchParams();
    params.append("To", toE164);
    params.append("Code", String(code).trim());

    const response = await fetch(checkUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.status === "approved" && data.valid === true) {
      console.log(`[Twilio Verify Check] Code successfully approved for ${maskPhoneNumber(rawNormalized)}`);
      return { approved: true, data };
    }

    return {
      approved: false,
      status: data.status || "failed",
      valid: Boolean(data.valid),
      error: data.message || "Code not approved by Twilio",
    };
  } catch (err) {
    console.warn(`[Twilio Verify Check Exception]:`, err.message);
    return { approved: false, error: err.message };
  }
}

