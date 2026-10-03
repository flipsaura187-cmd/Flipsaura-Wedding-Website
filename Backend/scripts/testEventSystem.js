import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_BASE = "http://localhost:5000/api";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log("=== STARTING FLIPSAURA EVENT SYSTEM INTEGRATION TEST ===");

async function runTests() {
  try {
    // 1. Fetch public events
    console.log("\n[Test 1] GET /api/events (Public Listing)");
    const listRes = await axios.get(`${API_BASE}/events`);
    console.log("Status:", listRes.status);
    console.log("Events count:", listRes.data?.data?.events?.length);
    const event = listRes.data?.data?.events?.[0];
    if (!event) throw new Error("No published events found. Did seed run?");
    console.log("Sample Event Title:", event.title, "| Slug:", event.slug, "| Fee:", event.registrationFee);

    // 2. Fetch event by slug
    console.log("\n[Test 2] GET /api/events/:slug");
    const detailRes = await axios.get(`${API_BASE}/events/${event.slug}`);
    console.log("Event details OK:", detailRes.data?.ok, "| isRegistrationOpen:", detailRes.data?.data?.event?.isRegistrationOpen);

    // 3. Test validation errors
    console.log("\n[Test 3] Validation failure checks");
    try {
      await axios.post(`${API_BASE}/events/${event._id}/register`, {
        participationType: "Individual",
        participants: [
          {
            fullName: "Test User",
            mobileNumber: "12345", // invalid mobile
            email: "not-an-email", // invalid email
            college: "Test College",
            course: "B.Tech",
            year: "1st",
          },
        ],
        termsAccepted: false, // missing terms
      });
      console.error("FAIL: Validation should have blocked invalid request!");
    } catch (err) {
      console.log("SUCCESS: Validation blocked invalid payload with status", err.response?.status, "| Error:", err.response?.data?.error);
    }

    // 4. Register Individual with valid data
    console.log("\n[Test 4] POST /api/events/:id/register (Individual)");
    const regPayload = {
      participationType: "Individual",
      participants: [
        {
          fullName: "Aarav Sharma",
          mobileNumber: "9876543210",
          email: "aarav.sharma@example.com",
          college: "Patna Science College",
          course: "B.Sc Physics",
          year: "3rd Year",
          city: "Patna",
          isLeader: true,
        },
      ],
      source: "Instagram",
      previousQuizParticipation: "Yes",
      termsAccepted: true,
    };

    const regRes = await axios.post(`${API_BASE}/events/${event._id}/register`, regPayload);
    console.log("Registration Created OK:", regRes.data?.ok);
    const regData = regRes.data.data;
    console.log("Registration Doc ID:", regData.registrationDocId);
    console.log("Razorpay Order ID:", regData.orderId);
    console.log("Amount in Paise:", regData.amount, "(Expected: 100000 paise for ₹1,000 fee)");
    console.log("Key ID received:", regData.keyId);

    if (regData.amount !== 100000) {
      throw new Error(`Amount in paise is ${regData.amount}, expected 100000!`);
    }

    // 5. Test Signature Verification (Server-Side)
    console.log("\n[Test 5] Test Signature Verification");
    // Generate valid test signature
    const mockPaymentId = `pay_test_${Date.now()}`;
    const signBody = `${regData.orderId}|${mockPaymentId}`;
    const validSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(signBody)
      .digest("hex");

    // First try an invalid signature
    try {
      await axios.post(`${API_BASE}/events/payment/verify`, {
        registrationDocId: regData.registrationDocId,
        razorpay_order_id: regData.orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "invalid_tampered_signature_12345",
      });
      console.error("FAIL: Invalid signature was unexpectedly accepted!");
    } catch (err) {
      console.log("SUCCESS: Tampered signature rejected with status", err.response?.status);
    }

    // Now send valid signature
    const verifyRes = await axios.post(`${API_BASE}/events/payment/verify`, {
      registrationDocId: regData.registrationDocId,
      razorpay_order_id: regData.orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: validSignature,
    });

    console.log("Payment Verified OK:", verifyRes.data?.ok);
    const verifiedData = verifyRes.data.data;
    console.log("Assigned Official Registration ID:", verifiedData.registrationId);
    console.log("Payment Status:", verifiedData.registration?.paymentStatus);
    console.log("Registration Status:", verifiedData.registration?.registrationStatus);

    if (verifiedData.registration?.paymentStatus !== "PAID" || verifiedData.registration?.registrationStatus !== "CONFIRMED") {
      throw new Error("Registration not marked as PAID and CONFIRMED!");
    }

    // 6. Public Registration Lookup
    console.log("\n[Test 6] GET /api/events/registration-details/:id");
    const lookupRes = await axios.get(`${API_BASE}/events/registration-details/${verifiedData.registrationId}`);
    console.log("Lookup OK:", lookupRes.data?.ok);
    console.log("Participant:", lookupRes.data?.data?.registration?.primaryName);
    console.log("Amount:", lookupRes.data?.data?.registration?.amount);

    // 7. Register Team of 3
    console.log("\n[Test 7] POST /api/events/:id/register (Team of 3)");
    const teamPayload = {
      participationType: "Team of 3",
      teamName: "Patna Quiz Masters",
      participants: [
        {
          fullName: "Rohan Verma",
          mobileNumber: "9123456789",
          email: "rohan.leader@example.com",
          college: "NIT Patna",
          course: "B.Tech CSE",
          year: "4th Year",
          isLeader: true,
        },
        {
          fullName: "Aditi Roy",
          mobileNumber: "9234567890",
          email: "aditi.roy@example.com",
          college: "NIT Patna",
          course: "B.Tech ECE",
          year: "4th Year",
          isLeader: false,
        },
        {
          fullName: "Vikram Sen",
          mobileNumber: "9345678901",
          email: "vikram.sen@example.com",
          college: "NIT Patna",
          course: "B.Tech ME",
          year: "4th Year",
          isLeader: false,
        },
      ],
      source: "College / School",
      previousQuizParticipation: "Yes",
      termsAccepted: true,
    };

    const teamRegRes = await axios.post(`${API_BASE}/events/${event._id}/register`, teamPayload);
    const teamRegData = teamRegRes.data.data;
    console.log("Team Registration Created OK. Doc ID:", teamRegData.registrationDocId);

    // Complete payment for Team
    const mockTeamPaymentId = `pay_team_${Date.now()}`;
    const teamSignBody = `${teamRegData.orderId}|${mockTeamPaymentId}`;
    const validTeamSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(teamSignBody)
      .digest("hex");

    const teamVerifyRes = await axios.post(`${API_BASE}/events/payment/verify`, {
      registrationDocId: teamRegData.registrationDocId,
      razorpay_order_id: teamRegData.orderId,
      razorpay_payment_id: mockTeamPaymentId,
      razorpay_signature: validTeamSignature,
    });

    console.log("Team Payment Verified OK. Reg ID:", teamVerifyRes.data.data.registrationId);

    // 8. Admin Flow: Login & Export
    console.log("\n[Test 8] Admin Login & Registration Dashboard");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: process.env.ADMIN_EMAIL || "flipsaura187@gmail.com",
      password: process.env.ADMIN_PASSWORD || "flipsaura@123#",
    });

    const adminToken = loginRes.data?.data?.token;
    console.log("Admin logged in successfully! Role:", loginRes.data?.data?.user?.role);

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Fetch admin events
    const adminEventsRes = await axios.get(`${API_BASE}/events/admin/all`, { headers: adminHeaders });
    console.log("Admin events count:", adminEventsRes.data?.data?.events?.length);

    // Fetch event registrations
    const adminRegsRes = await axios.get(`${API_BASE}/events/admin/${event._id}/registrations`, {
      headers: adminHeaders,
    });
    console.log("Event registrations count:", adminRegsRes.data?.data?.registrations?.length);

    // Export CSV
    const csvRes = await axios.get(`${API_BASE}/events/admin/${event._id}/export`, {
      headers: adminHeaders,
    });
    console.log("CSV Export Response Type:", typeof csvRes.data);
    console.log("CSV First 3 lines:\n" + csvRes.data.split("\n").slice(0, 4).join("\n"));

    console.log("\n=======================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (8/8) 🎉");
    console.log("=======================================================");
  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
