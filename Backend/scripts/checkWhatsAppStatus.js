import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";

const API_KEY = (
  process.env.WHATSAPP_API_KEY ||
  process.env.WHATSAPP_APIKEY ||
  "wag_live_j0BE5HDq_CUAvG-q5IkeHaED3CJyC-YmUvSaF43mktk"
).trim();

const BASE_URL = "https://waapi.fireclashpro.com/api/v1";

async function main() {
  console.log("\n========================================================");
  console.log("       FlipsAura WhatsApp Gateway Status Inspector      ");
  console.log("========================================================\n");

  try {
    // 1. List active sessions
    const sessionsRes = await fetch(`${BASE_URL}/sessions`, {
      headers: { "X-API-Key": API_KEY },
    });
    const sessions = await sessionsRes.json();
    console.log("Active Sessions on FireClashPro:", sessions);

    let session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (!session) {
      console.log("\nNo sessions found. Creating a new session 'FlipsAura'...");
      const createRes = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "FlipsAura" }),
      });
      session = await createRes.json();
      console.log("Created session:", session);
    }

    const sessionId = session.session_id || session.id;
    console.log(`\nInspecting Session ID: ${sessionId} (Status: ${session.status})`);

    if (session.status === "CONNECTED") {
      console.log(`\n WhatsApp Gateway is CONNECTED to: ${session.phone_number || "Active WhatsApp Account"}`);
      console.log("You can now send and receive WhatsApp booking notifications successfully!\n");
      return;
    }

    // If not connected, fetch the QR code
    console.log("\nSession is not connected yet. Fetching current QR code...");
    const qrRes = await fetch(`${BASE_URL}/sessions/${sessionId}/qr`, {
      headers: { "X-API-Key": API_KEY },
    });
    const qrData = await qrRes.json();

    if (qrData.qr_image_base64) {
      const base64Data = qrData.qr_image_base64.replace(/^data:image\/png;base64,/, "");
      const qrPath = path.resolve(process.cwd(), "whatsapp_qr.png");
      fs.writeFileSync(qrPath, base64Data, "base64");
      console.log(`\n QR code updated and saved to: ${qrPath}`);
      console.log("\nINSTRUCTIONS TO ACTIVATE:");
      console.log("1. Open WhatsApp on your phone.");
      console.log("2. Tap Menu (3 dots on Android) or Settings (iPhone) -> 'Linked Devices'.");
      console.log("3. Tap 'Link a device' and scan the QR code in whatsapp_qr.png.");
      console.log("4. Once scanned, run this script again to confirm status is CONNECTED.\n");
    } else {
      console.log("QR response:", qrData);
    }
  } catch (err) {
    console.error("Error inspecting WhatsApp status:", err);
  }
}

main();
