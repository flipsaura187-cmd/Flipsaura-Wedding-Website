/**
 * SMTP Diagnostic Script
 * Run from Backend folder: node test-email.mjs
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") });

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const rawPass = process.env.SMTP_PASS || "";
const pass = rawPass.replace(/\s+/g, "").trim();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SMTP Diagnostic Test");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Host    : ${host || "❌ NOT SET"}`);
console.log(`  Port    : ${port}`);
console.log(`  User    : ${user || "❌ NOT SET"}`);
console.log(`  Pass    : ${pass ? `✅ SET (${pass.length} chars)` : "❌ NOT SET"}`);
console.log(`  Pass raw: "${rawPass}"`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (!host || !user || !pass) {
  console.error("❌ SMTP credentials missing in .env — cannot proceed.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  tls: { rejectUnauthorized: false },
});

console.log("⏳ Step 1: Verifying SMTP connection...");
transporter.verify((err, success) => {
  if (err) {
    console.error("\n❌ SMTP CONNECTION FAILED!");
    console.error(`   Error Code : ${err.code}`);
    console.error(`   Message    : ${err.message}`);
    console.error(`   Response   : ${err.response || "none"}`);
    console.error(`   Command    : ${err.command || "none"}`);

    if (err.code === "EAUTH") {
      console.error("\n💡 FIX: Gmail App Password is WRONG or EXPIRED.");
      console.error("   1. Go to: https://myaccount.google.com/apppasswords");
      console.error("   2. Delete old password, generate a NEW one");
      console.error("   3. Update Backend/.env → SMTP_PASS=newpassword (no spaces)");
      console.error("   4. Restart backend: npm run dev");
    } else if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
      console.error("\n💡 FIX: Network/firewall is blocking port 587.");
      console.error("   Try port 465 instead: SMTP_PORT=465 in .env");
    } else if (err.code === "ESOCKET") {
      console.error("\n💡 FIX: Socket error — try using port 465 with secure:true.");
    }
    process.exit(1);
  }

  console.log("✅ Step 1: SMTP connection OK!\n");
  console.log("⏳ Step 2: Sending test email...");

  transporter.sendMail({
    from: `FlipsAura Test <${user}>`,
    to: user, // Send to self as test
    subject: "✅ FlipsAura SMTP Test — Email is working!",
    text: "If you received this, your SMTP is configured correctly.",
    html: `<h2>✅ FlipsAura SMTP Test</h2><p>Email is working correctly!</p><p>Time: ${new Date().toISOString()}</p>`,
  }, (sendErr, info) => {
    if (sendErr) {
      console.error("❌ SEND FAILED:", sendErr.message);
      process.exit(1);
    }
    console.log("✅ Step 2: Test email SENT successfully!");
    console.log(`   MessageId : ${info.messageId}`);
    console.log(`   Sent to   : ${user}`);
    console.log("\n🎉 SMTP is fully working! Check your Gmail inbox.");
    process.exit(0);
  });
});

