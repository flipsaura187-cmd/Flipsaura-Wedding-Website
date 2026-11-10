/**
 * Direct Forgot Password Email Test
 * Usage: node test-forgot-email.mjs your@email.com
 * Run from Backend folder
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

// Import mailer
const { sendPasswordResetMail } = await import("./lib/mailer.js");

const targetEmail = process.argv[2] || process.env.SMTP_USER;
const testResetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=TEST_TOKEN_123`;

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Forgot Password Email Test");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Sending to : ${targetEmail}`);
console.log(`  Reset URL  : ${testResetUrl}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

try {
  const result = await sendPasswordResetMail({
    to: targetEmail,
    name: "Test User",
    resetUrl: testResetUrl,
  });

  if (result?.skipped) {
    console.error("❌ SKIPPED — SMTP not configured properly");
    console.error("   Check SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
  } else {
    console.log("✅ Reset email sent successfully!");
    console.log(`   MessageId: ${result.messageId}`);
    console.log(`\n📧 Check inbox of: ${targetEmail}`);
  }
} catch (err) {
  console.error("❌ FAILED:", err.message);
  console.error("   Code:", err.code);
  console.error("   Response:", err.response);
}

