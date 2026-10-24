import express from "express";
import {
  getWhatsAppProvider,
  sendWhatsAppMessage,
  normalizePhoneNumber,
  maskPhoneNumber,
} from "../lib/whatsapp.js";

const router = express.Router();

const FIRECLASH_BASE = "https://waapi.fireclashpro.com/api/v1";

function getApiKey() {
  return (
    process.env.WHATSAPP_API_KEY ||
    process.env.WHATSAPP_APIKEY ||
    "wag_live_j0BE5HDq_CUAvG-q5IkeHaED3CJyC-YmUvSaF43mktk"
  ).trim();
}

/**
 * Returns current WhatsApp gateway status and session details.
 */
router.get("/status", async (req, res) => {
  const provider = getWhatsAppProvider();

  if (provider !== "fireclashpro") {
    return res.json({
      ok: true,
      provider,
      connected: provider === "meta" || provider === "twilio",
      status: provider === "meta" ? "META_CLOUD_API" : provider,
      adminPhone: process.env.WHATSAPP_ADMIN_PHONE || "Not configured",
    });
  }

  try {
    const apiKey = getApiKey();
    const sessionsRes = await fetch(`${FIRECLASH_BASE}/sessions`, {
      headers: { "X-API-Key": apiKey },
    });
    const sessions = await sessionsRes.json();
    const session = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;

    if (!session) {
      return res.json({
        ok: true,
        provider: "fireclashpro",
        connected: false,
        status: "NO_SESSION",
        message: "No WhatsApp session found on FireClashPro",
      });
    }

    res.json({
      ok: true,
      provider: "fireclashpro",
      sessionId: session.session_id || session.id,
      status: session.status,
      connected: session.status === "CONNECTED",
      phoneNumber: session.phone_number,
      adminPhone: process.env.WHATSAPP_ADMIN_PHONE || "Not configured",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Returns fresh QR code for linking WhatsApp.
 */
router.get("/qr", async (req, res) => {
  const provider = getWhatsAppProvider();
  if (provider !== "fireclashpro") {
    return res.json({
      ok: false,
      error: `Provider '${provider}' does not use QR pairing.`,
    });
  }

  try {
    const apiKey = getApiKey();
    const sessionsRes = await fetch(`${FIRECLASH_BASE}/sessions`, {
      headers: { "X-API-Key": apiKey },
    });
    let sessions = await sessionsRes.json();
    let session = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;

    if (!session) {
      const createRes = await fetch(`${FIRECLASH_BASE}/sessions`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "FlipsAura" }),
      });
      session = await createRes.json();
    }

    const sessionId = session.session_id || session.id;

    if (session.status === "CONNECTED") {
      return res.json({
        ok: true,
        connected: true,
        status: "CONNECTED",
        phoneNumber: session.phone_number,
      });
    }

    const qrRes = await fetch(`${FIRECLASH_BASE}/sessions/${sessionId}/qr`, {
      headers: { "X-API-Key": apiKey },
    });
    const qrData = await qrRes.json();

    res.json({
      ok: true,
      connected: false,
      sessionId,
      status: qrData.status || session.status,
      qrImage: qrData.qr_image_base64 || null,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Interactive QR Code Pairing & Status Page
 */
router.get("/connect", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlipsAura — Connect WhatsApp Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #faf5f8;
      color: #1e1b1d;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 20px 40px -15px rgba(230, 63, 135, 0.12), 0 0 1px 1px rgba(0,0,0,0.05);
      max-width: 480px;
      width: 100%;
      padding: 36px 32px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .badge.pending { background: #fef3c7; color: #92400e; }
    .badge.connected { background: #dcfce7; color: #166534; }
    .badge.error { background: #fee2e2; color: #991b1b; }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #1e1b1d;
      margin-bottom: 8px;
    }
    p.sub {
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .qr-container {
      position: relative;
      background: #f8fafc;
      border: 2px dashed #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      margin-bottom: 24px;
    }
    .qr-container img {
      max-width: 250px;
      width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .steps {
      text-align: left;
      background: #fdf2f8;
      border: 1px solid #fce7f3;
      border-radius: 16px;
      padding: 16px 20px;
      font-size: 13px;
      color: #831843;
      margin-bottom: 24px;
    }
    .steps ol { padding-left: 20px; }
    .steps li { margin-bottom: 6px; }
    .steps li:last-child { margin-bottom: 0; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      background: #e63f87;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover { background: #d02f74; transform: translateY(-1px); }
    .connected-box {
      display: none;
      padding: 24px 16px;
    }
    .connected-box .icon {
      font-size: 56px;
      margin-bottom: 12px;
      color: #22c55e;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="statusBadge" class="badge pending">Checking Connection...</div>
    <h1>Connect FlipsAura WhatsApp</h1>
    <p class="sub">Scan this QR code with WhatsApp on your phone to activate instant booking notifications for Admin & Customers.</p>

    <div id="qrBox" class="qr-container">
      <div id="loadingText" style="color: #64748b; font-size: 14px;">Loading QR Code...</div>
      <img id="qrImg" style="display: none;" alt="WhatsApp QR Code" />
    </div>

    <div id="connectedBox" class="connected-box">
      <div class="icon">✓</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #166534; margin-bottom: 6px;">WhatsApp Connected!</h2>
      <p id="connectedPhone" style="color: #475569; font-size: 14px; margin-bottom: 16px;"></p>
      <p style="color: #64748b; font-size: 13px;">New bookings will now trigger automated WhatsApp notifications to both Admin and Customers.</p>
    </div>

    <div id="stepsBox" class="steps">
      <ol>
        <li>Open <strong>WhatsApp</strong> on your phone.</li>
        <li>Tap <strong>Linked Devices</strong> (in Menu ⋮ on Android or Settings on iPhone).</li>
        <li>Tap <strong>Link a device</strong> and point your camera at this QR code.</li>
      </ol>
    </div>

    <button id="refreshBtn" class="btn" onclick="fetchQR()">Refresh QR Code</button>
  </div>

  <script>
    async function checkStatus() {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        const badge = document.getElementById('statusBadge');
        const qrBox = document.getElementById('qrBox');
        const stepsBox = document.getElementById('stepsBox');
        const refreshBtn = document.getElementById('refreshBtn');
        const connectedBox = document.getElementById('connectedBox');
        const connectedPhone = document.getElementById('connectedPhone');

        if (data.connected) {
          badge.className = 'badge connected';
          badge.textContent = 'CONNECTED';
          qrBox.style.display = 'none';
          stepsBox.style.display = 'none';
          refreshBtn.style.display = 'none';
          connectedBox.style.display = 'block';
          connectedPhone.textContent = data.phoneNumber ? 'Linked Number: +' + data.phoneNumber : 'Session Active';
          return true;
        } else {
          badge.className = 'badge pending';
          badge.textContent = 'ACTION REQUIRED: SCAN QR';
          return false;
        }
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    async function fetchQR() {
      const isConnected = await checkStatus();
      if (isConnected) return;

      const loadingText = document.getElementById('loadingText');
      const qrImg = document.getElementById('qrImg');
      loadingText.textContent = 'Refreshing QR code...';
      loadingText.style.display = 'block';
      qrImg.style.display = 'none';

      try {
        const res = await fetch('/api/whatsapp/qr');
        const data = await res.json();
        if (data.connected) {
          await checkStatus();
          return;
        }
        if (data.qrImage) {
          qrImg.src = data.qrImage;
          qrImg.style.display = 'block';
          loadingText.style.display = 'none';
        } else {
          loadingText.textContent = 'Waiting for QR code generation...';
        }
      } catch (e) {
        loadingText.textContent = 'Failed to load QR code. Please check backend.';
      }
    }

    fetchQR();
    // Auto-poll status every 6 seconds so as soon as user scans on phone, screen turns green
    setInterval(checkStatus, 6000);
  </script>
</body>
</html>`);
});

/**
 * Sends a test WhatsApp notification to verify delivery.
 */
router.post("/test", async (req, res) => {
  const target = req.body.phone || process.env.WHATSAPP_ADMIN_PHONE;
  if (!target) {
    return res.status(400).json({
      ok: false,
      error: "Phone number required (or configure WHATSAPP_ADMIN_PHONE in .env)",
    });
  }

  const result = await sendWhatsAppMessage({
    to: target,
    text: `*FlipsAura Test Message*\n\nWhatsApp Notifications are now working properly!\nTime: ${new Date().toLocaleString("en-IN")}\nAdmin Phone: ${maskPhoneNumber(target)}`,
  });

  res.json({ ok: result.success, result });
});

export default router;
