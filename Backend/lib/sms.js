/**
 * Normal SMS Gateway Integration for FlipsAura
 * Sends carrier text messages (Normal SMS) to mobile numbers.
 * Supports Twilio Verify SMS, Twilio REST SMS, and Fast2SMS.
 */

import { maskPhoneNumber, normalizePhoneNumber } from "./whatsapp.js";
import { sendTwilioOtp } from "./twilio.js";

/**
 * Sends a normal SMS OTP to the recipient's mobile number.
 */
export async function sendNormalSmsOtp(phone, otp) {
  const rawNormalized = normalizePhoneNumber(phone);
  if (!rawNormalized || rawNormalized.length < 10) {
    return {
      success: false,
      error: "Invalid phone number format for SMS delivery.",
    };
  }

  // 10-digit clean mobile number for Indian SMS gateways (e.g. 7016973928)
  const indian10Digit = rawNormalized.length > 10 && rawNormalized.startsWith("91")
    ? rawNormalized.slice(2)
    : rawNormalized.slice(-10);

  const toE164 = `+${rawNormalized}`;
  const masked = maskPhoneNumber(rawNormalized);

  console.log(`\n======================================================`);
  console.log(`[Normal SMS Dispatch]`);
  console.log(`To Phone : ${masked} (${toE164})`);
  console.log(`Code     : ${otp}`);
  console.log(`======================================================\n`);

  // 1. Fast2SMS Indian SMS Gateway (if FAST2SMS_API_KEY configured)
  const fast2smsKey = (process.env.FAST2SMS_API_KEY || "").trim();
  if (fast2smsKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Your FlipsAura verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP.`,
          language: "english",
          flash: 0,
          numbers: indian10Digit,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.return === true) {
        console.log(`[Fast2SMS] Normal SMS dispatched successfully to ${masked} (ReqID: ${data.request_id})`);
        return {
          success: true,
          provider: "fast2sms",
          requestId: data.request_id,
          message: data.message?.[0] || "SMS sent successfully",
        };
      }
      console.warn(`[Fast2SMS Warning]:`, data.message || "Fast2SMS dispatch failed");
    } catch (err) {
      console.warn(`[Fast2SMS Exception]:`, err.message);
    }
  }

  // 2. Twilio Normal SMS (via Twilio Verify SMS channel or Twilio Messages SMS)
  const hasTwilio = Boolean(
    (process.env.TWILIO_ACCOUNT_SID || process.env.Twilio_Account_SID) &&
    (process.env.TWILIO_AUTH_TOKEN || process.env.Twilio_Auth_Token)
  );

  if (hasTwilio) {
    const twilioResult = await sendTwilioOtp(phone, otp);
    if (twilioResult.success) {
      console.log(`[Twilio SMS] Normal SMS dispatched successfully to ${masked}`);
      return {
        ...twilioResult,
        isNormalSms: true,
      };
    }
    console.warn(`[Twilio SMS Warning]:`, twilioResult.error);
    return twilioResult;
  }

  return {
    success: false,
    error: "No SMS gateway configured. Please check Twilio or SMS API credentials in .env.",
  };
}

