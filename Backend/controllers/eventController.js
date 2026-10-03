import crypto from "crypto";
import { dbConnect } from "../lib/db.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { getRazorpay, verifyRazorpaySignature } from "../lib/razorpay.js";
import { sendMail } from "../lib/mailer.js";

// Helper to generate a unique Human-friendly Registration ID (e.g. CVC-82F391)
function generateRegistrationId(event) {
  let prefix = "EVT";
  if (event?.slug?.includes("civic-cup")) {
    prefix = "CVC";
  } else if (event?.slug) {
    const clean = event.slug.replace(/[^a-zA-Z]/g, "").toUpperCase();
    prefix = clean.slice(0, 3) || "EVT";
  }
  const randomChars = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${randomChars}`;
}

// Phone validator: Indian 10-digit mobile
function isValidIndianMobile(phone) {
  const cleaned = String(phone || "").replace(/[^0-9]/g, "");
  // Matches 10 digits starting with 6-9, or with +91/0 prefix
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) return true;
  if (cleaned.length === 12 && cleaned.startsWith("91") && /^[6-9]\d{9}$/.test(cleaned.slice(2))) return true;
  return false;
}

// Clean phone to 10 digits
function cleanIndianMobile(phone) {
  const cleaned = String(phone || "").replace(/[^0-9]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(2);
  if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.slice(1);
  return cleaned;
}

// Email validator
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

/**
 * Public: Get published active events (with optional featured filter)
 */
export async function getPublicEvents(req, res) {
  try {
    await dbConnect();
    const query = { status: "PUBLISHED" };
    if (req.query.featured === "true") {
      query.featured = true;
    }

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, data: { events } });
  } catch (error) {
    console.error("getPublicEvents error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch events" });
  }
}

/**
 * Public: Get single event by slug
 */
export async function getEventBySlug(req, res) {
  try {
    await dbConnect();
    const { slug } = req.params;
    const event = await Event.findOne({
      $or: [
        { slug: String(slug).toLowerCase() },
        ...(String(slug).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: slug }] : []),
      ],
    }).lean();

    if (!event) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    // Check if registration is open
    const now = new Date();
    let isRegistrationOpen = event.status === "PUBLISHED" && event.registrationEnabled !== false;
    if (event.registrationClose && new Date(event.registrationClose) < now) {
      isRegistrationOpen = false;
    }

    res.json({
      ok: true,
      data: {
        event: {
          ...event,
          isRegistrationOpen,
        },
      },
    });
  } catch (error) {
    console.error("getEventBySlug error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch event" });
  }
}

/**
 * Public: Register for an event & Create Razorpay Order
 */
export async function registerForEvent(req, res) {
  try {
    await dbConnect();
    const { slug } = req.params;
    const {
      participationType,
      teamName,
      participants,
      source,
      previousQuizParticipation,
      termsAccepted,
    } = req.body;

    const event = await Event.findOne({
      $or: [
        { slug: String(slug).toLowerCase() },
        ...(String(slug).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: slug }] : []),
      ],
    });
    if (!event) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    if (event.status !== "PUBLISHED" || event.registrationEnabled === false) {
      return res.status(400).json({ ok: false, error: "Registration for this event is currently closed." });
    }

    if (event.registrationClose && new Date(event.registrationClose) < new Date()) {
      return res.status(400).json({ ok: false, error: "Registration deadline for this event has passed." });
    }

    if (!termsAccepted) {
      return res.status(400).json({ ok: false, error: "You must agree to all event terms & conditions to proceed." });
    }

    // Validate participation type
    const validTypes = ["Individual", "Team of 3"];
    if (!validTypes.includes(participationType)) {
      return res.status(400).json({ ok: false, error: "Invalid participation type. Choose Individual or Team of 3." });
    }

    // Validate participants
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ ok: false, error: "Participant details are required." });
    }

    if (participationType === "Individual") {
      if (participants.length !== 1) {
        return res.status(400).json({ ok: false, error: "Individual participation must have exactly 1 participant." });
      }
    } else if (participationType === "Team of 3") {
      if (!teamName?.trim()) {
        return res.status(400).json({ ok: false, error: "Team Name is required for Team participation." });
      }
      if (participants.length !== 3) {
        return res.status(400).json({ ok: false, error: "Team of 3 must have all 3 member details filled." });
      }
    }

    // Validate each participant's fields
    const sanitizedParticipants = [];
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const memberLabel = participationType === "Team of 3" ? `Member ${i + 1}` : "Participant";

      const name = (p.name || p.fullName || "").trim();
      const email = (p.email || "").trim().toLowerCase();
      const rawPhone = p.phone || p.mobileNumber || "";
      const college = (p.college || "").trim();
      const course = (p.course || "").trim();
      const yearOrSemester = (p.yearOrSemester || p.year || "").trim();
      const city = (p.city || "").trim();

      if (!name) {
        return res.status(400).json({ ok: false, error: `Full name is required for ${memberLabel}.` });
      }
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: `A valid email address is required for ${memberLabel}.` });
      }
      if (!rawPhone || !isValidIndianMobile(rawPhone)) {
        return res.status(400).json({
          ok: false,
          error: `A valid 10-digit Indian mobile number is required for ${memberLabel}.`,
        });
      }
      if (!college) {
        return res.status(400).json({ ok: false, error: `College / School name is required for ${memberLabel}.` });
      }
      if (!course) {
        return res.status(400).json({ ok: false, error: `Course / Class is required for ${memberLabel}.` });
      }
      if (!yearOrSemester) {
        return res.status(400).json({ ok: false, error: `Year / Semester is required for ${memberLabel}.` });
      }

      sanitizedParticipants.push({
        isLeader: i === 0, // First member is always Team Leader / Primary
        name,
        email,
        phone: cleanIndianMobile(rawPhone),
        college,
        course,
        yearOrSemester,
        city,
      });
    }

    const primary = sanitizedParticipants[0];

    // Important: Amount is strictly enforced from the database Event record
    const amountInRupees = event.registrationFee;
    const amountInPaise = Math.round(amountInRupees * 100);

    // 1. Create Registration document in MongoDB
    const registration = await Registration.create({
      event: event._id,
      eventSlug: event.slug,
      eventTitle: event.title,
      participationType,
      teamName: participationType === "Team of 3" ? teamName.trim() : "",
      participants: sanitizedParticipants,
      primaryName: primary.name,
      primaryEmail: primary.email,
      primaryPhone: primary.phone,
      primaryCollege: primary.college,
      city: primary.city || event.city,
      source: source || "Other",
      previousQuizParticipation: previousQuizParticipation || "No",
      termsAccepted: true,
      amount: amountInRupees,
      currency: event.currency || "INR",
      paymentStatus: "CREATED",
      registrationStatus: "PENDING_PAYMENT",
    });

    // 2. Create Razorpay order
    const rzp = getRazorpay();
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: event.currency || "INR",
      receipt: `reg_${registration._id}`,
      notes: {
        registrationDbId: String(registration._id),
        eventSlug: event.slug,
        eventTitle: event.title,
        participationType,
        primaryEmail: primary.email,
      },
    });

    registration.payment = {
      provider: "razorpay",
      orderId: order.id,
      paymentId: "",
      signature: "",
      paidAt: null,
      failureReason: "",
    };
    await registration.save();

    res.json({
      ok: true,
      data: {
        registrationDocId: String(registration._id),
        registrationDbId: String(registration._id),
        orderId: order.id,
        amount: order.amount, // paise
        amountRupees: amountInRupees,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        event: {
          title: event.title,
          slug: event.slug,
          organizer: event.organizer,
          venue: event.venue,
          registrationFee: amountInRupees,
        },
        prefill: {
          name: primary.name,
          email: primary.email,
          contact: primary.phone,
        },
      },
    });
  } catch (error) {
    console.error("registerForEvent error:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to initiate registration" });
  }
}

/**
 * Public: Verify Razorpay Payment Signature
 */
export async function verifyEventPayment(req, res) {
  try {
    const registrationIdToFind =
      req.body.registrationDbId || req.body.registrationDocId || req.body.registrationId;
    const orderId = req.body.razorpay_order_id || req.body.orderId;
    const paymentId = req.body.razorpay_payment_id || req.body.paymentId;
    const signature = req.body.razorpay_signature || req.body.signature;

    if (!registrationIdToFind || !orderId || !paymentId || !signature) {
      return res.status(400).json({ ok: false, error: "Missing Razorpay verification parameters" });
    }

    // Server-side HMAC SHA256 Signature verification
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    });

    await dbConnect();
    const registration = await Registration.findById(registrationIdToFind);
    if (!registration) {
      return res.status(404).json({ ok: false, error: "Registration record not found" });
    }

    if (!isValid) {
      registration.paymentStatus = "FAILED";
      registration.registrationStatus = "PAYMENT_FAILED";
      registration.payment.failureReason = "Invalid payment signature";
      await registration.save();
      return res.status(400).json({ ok: false, error: "Payment verification failed. Signature mismatch." });
    }

    // Idempotency: if already confirmed, just return it
    if (registration.registrationStatus === "CONFIRMED" && registration.paymentStatus === "PAID") {
      return res.json({
        ok: true,
        message: "Payment already verified",
        data: { registration },
      });
    }

    const event = await Event.findById(registration.event);

    // Generate unique Registration ID if not set
    if (!registration.registrationId) {
      let uniqueId = generateRegistrationId(event);
      // Ensure uniqueness in DB
      let existing = await Registration.findOne({ registrationId: uniqueId });
      while (existing) {
        uniqueId = generateRegistrationId(event);
        existing = await Registration.findOne({ registrationId: uniqueId });
      }
      registration.registrationId = uniqueId;
    }

    // Mark as PAID and CONFIRMED
    registration.paymentStatus = "PAID";
    registration.registrationStatus = "CONFIRMED";
    registration.payment = {
      provider: "razorpay",
      orderId,
      paymentId,
      signature,
      paidAt: new Date(),
      failureReason: "",
    };

    await registration.save();

    // Send confirmation email (non-blocking)
    try {
      if (registration.primaryEmail) {
        await sendMail({
          to: registration.primaryEmail,
          subject: `🎉 Registration Confirmed: ${event?.title || "The Civic Cup"} (#${registration.registrationId})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ebdbe2; border-radius: 12px; background: #fff;">
              <h2 style="color: #8B1E3F; margin-top: 0;">🎉 Registration Confirmed!</h2>
              <p>Thank you for registering for <b>${event?.title || "The Civic Cup"}</b>.</p>
              <div style="background: #FFF5F8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Registration ID:</strong> <span style="font-size: 18px; color: #e63f87; font-weight: bold;">${registration.registrationId}</span></p>
                <p style="margin: 4px 0;"><strong>Participation:</strong> ${registration.participationType} ${registration.teamName ? `(${registration.teamName})` : ""}</p>
                <p style="margin: 4px 0;"><strong>Primary Contact:</strong> ${registration.primaryName} (${registration.primaryPhone})</p>
                <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${registration.amount?.toLocaleString("en-IN")}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">PAID & CONFIRMED</span></p>
                <p style="margin: 4px 0;"><strong>Venue:</strong> ${event?.venue || "Patna, Bihar"}</p>
              </div>
              <p style="color: #666; font-size: 14px;">Please keep your Registration ID handy during entry and event rounds.</p>
              <p style="font-style: italic; color: #8B1E3F; font-weight: bold;">Think. Compete. Conquer.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Organized by ${event?.organizer || "Flipsaura × Marritcredence"}</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn("Event registration email error (non-fatal):", mailErr.message);
    }

    res.json({
      ok: true,
      message: "Payment successfully verified and registration confirmed!",
      data: {
        registrationId: registration.registrationId,
        registrationDocId: String(registration._id),
        registration,
      },
    });
  } catch (error) {
    console.error("verifyEventPayment error:", error);
    res.status(500).json({ ok: false, error: error.message || "Payment verification failed" });
  }
}

/**
 * Public: Report payment cancellation / failure for retry handling
 */
export async function reportPaymentFailure(req, res) {
  try {
    const { registrationDbId, errorReason } = req.body;
    if (!registrationDbId) {
      return res.status(400).json({ ok: false, error: "registrationDbId required" });
    }

    await dbConnect();
    const registration = await Registration.findById(registrationDbId);
    if (registration && registration.registrationStatus !== "CONFIRMED") {
      registration.paymentStatus = "FAILED";
      registration.registrationStatus = "PAYMENT_FAILED";
      registration.payment = {
        ...(registration.payment || {}),
        failureReason: errorReason || "Payment dismissed or cancelled by user",
      };
      await registration.save();
    }

    res.json({ ok: true, data: { registrationDbId } });
  } catch (error) {
    console.error("reportPaymentFailure error:", error);
    res.status(500).json({ ok: false, error: "Failed to record failure" });
  }
}

/**
 * Public: Retry payment for an existing pending/failed registration without creating duplicates
 */
export async function retryEventPayment(req, res) {
  try {
    const { registrationDocId } = req.body;
    if (!registrationDocId) {
      return res.status(400).json({ ok: false, error: "registrationDocId is required" });
    }

    await dbConnect();
    const registration = await Registration.findById(registrationDocId);
    if (!registration) {
      return res.status(404).json({ ok: false, error: "Registration not found" });
    }

    if (registration.registrationStatus === "CONFIRMED" && registration.paymentStatus === "PAID") {
      return res.json({
        ok: true,
        alreadyPaid: true,
        data: { registrationId: registration.registrationId },
      });
    }

    const event = await Event.findById(registration.event);
    if (!event) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    const rzp = getRazorpay();
    const amountInRupees = event.registrationFee;
    const amountInPaise = Math.round(amountInRupees * 100);

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: event.currency || "INR",
      receipt: `retry_${registration._id}_${Date.now().toString().slice(-4)}`,
      notes: {
        registrationDbId: String(registration._id),
        eventSlug: event.slug,
        isRetry: "true",
      },
    });

    registration.paymentStatus = "PENDING";
    registration.payment = {
      ...(registration.payment || {}),
      orderId: order.id,
      failureReason: "",
    };
    await registration.save();

    res.json({
      ok: true,
      data: {
        registrationDocId: String(registration._id),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        event: {
          title: event.title,
          slug: event.slug,
          registrationFee: event.registrationFee,
        },
        primaryContact: {
          fullName: registration.primaryName,
          email: registration.primaryEmail,
          mobileNumber: registration.primaryPhone,
        },
      },
    });
  } catch (error) {
    console.error("retryEventPayment error:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to initiate payment retry" });
  }
}

/**
 * Public: Get confirmed registration receipt details by ID or registrationId
 */
export async function getRegistrationDetails(req, res) {
  try {
    await dbConnect();
    const identifier = String(req.params.identifier || "").trim();
    if (!identifier) {
      return res.status(400).json({ ok: false, error: "Identifier is required" });
    }

    const registration = await Registration.findOne({
      $or: [
        { registrationId: identifier },
        { registrationId: identifier.toUpperCase() },
        ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
      ],
    })
      .populate("event")
      .lean();

    if (!registration) {
      return res.status(404).json({ ok: false, error: "Registration not found" });
    }

    res.json({
      ok: true,
      data: {
        registration: {
          ...registration,
          eventTitle: registration.event?.title || registration.eventTitle,
          eventSlug: registration.event?.slug || registration.eventSlug,
          organizer: registration.event?.organizer,
          venue: registration.event?.venue,
          city: registration.city || registration.event?.city,
          eventDate: registration.event?.date,
          razorpayPaymentId: registration.payment?.paymentId,
        },
      },
    });
  } catch (error) {
    console.error("getRegistrationDetails error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch registration" });
  }
}

/**
 * Public: Razorpay Webhook endpoint for server-to-server sync
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        console.warn("Razorpay Webhook signature mismatch");
        return res.status(400).json({ ok: false, error: "Invalid webhook signature" });
      }
    }

    const eventPayload = req.body;
    const eventType = eventPayload?.event;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventPayload?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        await dbConnect();
        const reg = await Registration.findOne({ "payment.orderId": orderId });
        if (reg && reg.registrationStatus !== "CONFIRMED") {
          const event = await Event.findById(reg.event);
          if (!reg.registrationId) {
            reg.registrationId = generateRegistrationId(event);
          }
          reg.paymentStatus = "PAID";
          reg.registrationStatus = "CONFIRMED";
          reg.payment.paymentId = paymentId || reg.payment.paymentId;
          reg.payment.paidAt = new Date();
          await reg.save();
          console.log(`[Webhook] Confirmed registration ${reg.registrationId} for order ${orderId}`);
        }
      }
    }

    res.json({ ok: true, received: true });
  } catch (error) {
    console.error("handleRazorpayWebhook error:", error);
    res.status(500).json({ ok: false, error: "Webhook handling error" });
  }
}

// =========================================================================
// ADMIN CONTROLLER FUNCTIONS
// =========================================================================

/**
 * Admin: List all events with registration statistics
 */
export async function getAdminEvents(req, res) {
  try {
    await dbConnect();
    const events = await Event.find().sort({ createdAt: -1 }).lean();

    // Augment with count of registrations and revenue
    const augmentedEvents = await Promise.all(
      events.map(async (ev) => {
        const [totalRegistrations, confirmedCount, revenueAgg] = await Promise.all([
          Registration.countDocuments({ event: ev._id }),
          Registration.countDocuments({ event: ev._id, registrationStatus: "CONFIRMED" }),
          Registration.aggregate([
            { $match: { event: ev._id, registrationStatus: "CONFIRMED" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);

        return {
          ...ev,
          totalRegistrations,
          confirmedCount,
          totalRevenue: revenueAgg[0]?.total || 0,
        };
      })
    );

    res.json({ ok: true, data: { events: augmentedEvents } });
  } catch (error) {
    console.error("getAdminEvents error:", error);
    res.status(500).json({ ok: false, error: "Failed to load admin events" });
  }
}

/**
 * Admin: Get single event for editing
 */
export async function getAdminEventById(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const event = await Event.findById(id).lean();
    if (!event) return res.status(404).json({ ok: false, error: "Event not found" });

    res.json({ ok: true, data: { event } });
  } catch (error) {
    console.error("getAdminEventById error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch event" });
  }
}

/**
 * Admin: Create event
 */
export async function createAdminEvent(req, res) {
  try {
    await dbConnect();
    const payload = req.body;

    if (!payload.title?.trim()) {
      return res.status(400).json({ ok: false, error: "Event title is required." });
    }

    // Auto-generate slug if not provided
    let slug = payload.slug?.trim().toLowerCase();
    if (!slug) {
      slug = payload.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    // Check duplicate slug
    const existing = await Event.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const event = await Event.create({
      ...payload,
      slug,
      registrationFee: Number(payload.registrationFee) || 0,
    });

    res.status(201).json({ ok: true, message: "Event created successfully", data: { event } });
  } catch (error) {
    console.error("createAdminEvent error:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create event" });
  }
}

/**
 * Admin: Update event
 */
export async function updateAdminEvent(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const payload = req.body;

    if (payload.slug) {
      payload.slug = payload.slug.trim().toLowerCase();
      const existing = await Event.findOne({ slug: payload.slug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ ok: false, error: "Another event already uses this slug URL." });
      }
    }

    if (payload.registrationFee !== undefined) {
      payload.registrationFee = Number(payload.registrationFee) || 0;
    }

    const event = await Event.findByIdAndUpdate(id, payload, { new: true });
    if (!event) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    res.json({ ok: true, message: "Event updated successfully", data: { event } });
  } catch (error) {
    console.error("updateAdminEvent error:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update event" });
  }
}

/**
 * Admin: Delete event
 */
export async function deleteAdminEvent(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ ok: false, error: "Event not found" });

    // Count registrations
    const regCount = await Registration.countDocuments({ event: id, registrationStatus: "CONFIRMED" });
    if (regCount > 0) {
      return res.status(400).json({
        ok: false,
        error: `Cannot delete event with ${regCount} confirmed registrations. Please set status to CLOSED or ARCHIVED instead.`,
      });
    }

    await Event.findByIdAndDelete(id);
    await Registration.deleteMany({ event: id });

    res.json({ ok: true, message: "Event and unconfirmed drafts deleted successfully" });
  } catch (error) {
    console.error("deleteAdminEvent error:", error);
    res.status(500).json({ ok: false, error: "Failed to delete event" });
  }
}

/**
 * Admin: List registrations for an event with search & filters
 */
export async function getAdminEventRegistrations(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { search, paymentStatus, participationType, registrationStatus } = req.query;

    const event = await Event.findById(id).lean();
    if (!event) return res.status(404).json({ ok: false, error: "Event not found" });

    const query = { event: id };

    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus.toUpperCase();
    }

    if (registrationStatus && registrationStatus !== "all") {
      query.registrationStatus = registrationStatus.toUpperCase();
    }

    if (participationType && participationType !== "all") {
      query.participationType = participationType;
    }

    if (search?.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { registrationId: sRegex },
        { primaryName: sRegex },
        { primaryEmail: sRegex },
        { primaryPhone: sRegex },
        { primaryCollege: sRegex },
        { teamName: sRegex },
        { "participants.name": sRegex },
        { "participants.email": sRegex },
        { "payment.orderId": sRegex },
        { "payment.paymentId": sRegex },
      ];
    }

    const registrations = await Registration.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Summary counts
    const [total, paid, pending, failed, individualCount, teamCount] = await Promise.all([
      Registration.countDocuments({ event: id }),
      Registration.countDocuments({ event: id, paymentStatus: "PAID" }),
      Registration.countDocuments({ event: id, paymentStatus: { $in: ["CREATED", "PENDING"] } }),
      Registration.countDocuments({ event: id, paymentStatus: "FAILED" }),
      Registration.countDocuments({ event: id, participationType: "Individual" }),
      Registration.countDocuments({ event: id, participationType: "Team of 3" }),
    ]);

    res.json({
      ok: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          slug: event.slug,
          registrationFee: event.registrationFee,
        },
        registrations,
        counts: {
          total,
          paid,
          pending,
          failed,
          individual: individualCount,
          team: teamCount,
        },
      },
    });
  } catch (error) {
    console.error("getAdminEventRegistrations error:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch event registrations" });
  }
}

/**
 * Admin: Export registrations to CSV
 */
export async function exportEventRegistrationsCsv(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const event = await Event.findById(id).lean();
    if (!event) return res.status(404).send("Event not found");

    const registrations = await Registration.find({ event: id })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Registration ID",
      "Registration Status",
      "Payment Status",
      "Participation Type",
      "Team Name",
      "Amount (INR)",
      "Primary Contact Name",
      "Primary Email",
      "Primary Phone",
      "College / School",
      "Course / Class",
      "Year / Semester",
      "City",
      "Member 1",
      "Member 2",
      "Member 3",
      "How Did You Hear",
      "Previous Quiz Experience",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Registered At",
    ];

    const rows = registrations.map((r) => {
      const m1 = r.participants?.[0]
        ? `${r.participants[0].name} (${r.participants[0].phone}, ${r.participants[0].college})`
        : "";
      const m2 = r.participants?.[1]
        ? `${r.participants[1].name} (${r.participants[1].phone}, ${r.participants[1].college})`
        : "";
      const m3 = r.participants?.[2]
        ? `${r.participants[2].name} (${r.participants[2].phone}, ${r.participants[2].college})`
        : "";

      return [
        r.registrationId || "—",
        r.registrationStatus,
        r.paymentStatus,
        r.participationType,
        r.teamName || "—",
        r.amount,
        r.primaryName,
        r.primaryEmail,
        r.primaryPhone,
        r.primaryCollege || "—",
        r.participants?.[0]?.course || "—",
        r.participants?.[0]?.yearOrSemester || "—",
        r.city || "—",
        m1,
        m2,
        m3,
        r.source || "—",
        r.previousQuizParticipation || "—",
        r.payment?.orderId || "—",
        r.payment?.paymentId || "—",
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const safeSlug = (event.slug || "event").replace(/[^a-z0-9_-]/gi, "");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safeSlug}-registrations.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("exportEventRegistrationsCsv error:", error);
    res.status(500).send("Failed to export registrations");
  }
}
