import { dbConnect } from "../lib/db.js";
import Vehicle from "../models/Vehicle.js";
import VehicleBooking from "../models/VehicleBooking.js";
import User from "../models/User.js";
import { sendMail } from "../lib/mailer.js";

// Helper: Generate Unique Human-Readable Booking Ref
function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FL-VB-${Date.now().toString().slice(-4)}${random}`;
}

// Helper: Check rental dates overlap for confirmed/in-progress bookings
export async function checkRentalAvailability(vehicleId, startDate, endDate, excludeBookingId = null) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return { available: false, error: "Invalid start or end date range." };
  }

  const query = {
    vehicle: vehicleId,
    serviceType: "RENTAL",
    status: { $in: ["CONFIRMED", "IN_PROGRESS"] },
    "rentalDetails.startDate": { $lt: end },
    "rentalDetails.endDate": { $gt: start },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await VehicleBooking.findOne(query).lean();
  if (conflict) {
    return {
      available: false,
      conflictBooking: {
        bookingRef: conflict.bookingRef,
        startDate: conflict.rentalDetails?.startDate,
        endDate: conflict.rentalDetails?.endDate,
      },
      error: "Vehicle is already confirmed/booked for the selected dates and times.",
    };
  }

  return { available: true };
}

// Helper: Server-Side Price Calculation
export function calculatePricing(vehicle, serviceType, details) {
  if (serviceType === "RENTAL") {
    const start = new Date(details.startDate);
    const end = new Date(details.endDate);
    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const diffDays = Math.max(1, Math.ceil(diffHours / 24));

    let basePrice = 0;
    const perDay = vehicle.rentalPricing?.pricePerDay || 0;
    const perHour = vehicle.rentalPricing?.pricePerHour || 0;

    if (perDay > 0 && diffHours >= 24) {
      basePrice = diffDays * perDay;
    } else if (perHour > 0) {
      basePrice = diffHours * perHour;
    } else if (perDay > 0) {
      basePrice = perDay;
    } else {
      basePrice = 0;
    }

    const securityDeposit = vehicle.rentalPricing?.securityDeposit || 0;
    const taxes = 0;
    const totalAmount = basePrice + securityDeposit + taxes;

    return {
      basePrice,
      securityDeposit,
      driverAllowance: 0,
      taxes,
      extraCharges: 0,
      totalAmount,
      durationHours: diffHours,
      durationDays: diffDays,
    };
  } else if (serviceType === "TRANSPORT") {
    const isRoundTrip = details.tripType === "round_trip";
    const pricingType = vehicle.transportPricing?.pricingType || "fixed";
    const baseTripPrice = vehicle.transportPricing?.baseTripPrice || 0;
    const driverAllowance = vehicle.transportPricing?.driverAllowance || 0;

    if (pricingType === "quote") {
      return {
        basePrice: 0,
        securityDeposit: 0,
        driverAllowance: 0,
        taxes: 0,
        extraCharges: 0,
        totalAmount: 0,
        isQuoteRequired: true,
      };
    }

    let basePrice = baseTripPrice;
    if (isRoundTrip) {
      basePrice = Math.round(basePrice * 1.85); // Discounted round trip
    }

    const totalAmount = basePrice + driverAllowance;
    return {
      basePrice,
      securityDeposit: 0,
      driverAllowance,
      taxes: 0,
      extraCharges: 0,
      totalAmount,
      isQuoteRequired: false,
    };
  }

  throw new Error("Invalid service type specified.");
}

// ========================================================
// 1. PUBLIC VEHICLE BROWSING & DETAILS
// ========================================================

export async function getVehicles(req, res) {
  try {
    await dbConnect();
    const {
      serviceType, // "rental", "transport"
      vehicleType, // "car", "four_wheeler", "auto", "bus"
      city,
      minPrice,
      maxPrice,
      seating,
      fuelType,
      transmission,
      q,
      sort,
      limit = 24,
      page = 1,
    } = req.query;

    const filter = { active: true, verificationStatus: "verified" };

    if (serviceType) {
      filter.supportedServices = serviceType;
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (city) {
      filter.city = { $regex: new RegExp(city.trim(), "i") };
    }

    if (seating) {
      filter.seatingCapacity = { $gte: Number(seating) };
    }

    if (fuelType) {
      filter.fuelType = fuelType;
    }

    if (transmission) {
      filter.transmission = transmission;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: new RegExp(q.trim(), "i") } },
        { brand: { $regex: new RegExp(q.trim(), "i") } },
        { model: { $regex: new RegExp(q.trim(), "i") } },
        { city: { $regex: new RegExp(q.trim(), "i") } },
        { description: { $regex: new RegExp(q.trim(), "i") } },
      ];
    }

    if (minPrice || maxPrice) {
      const priceField =
        serviceType === "transport"
          ? "transportPricing.baseTripPrice"
          : "rentalPricing.pricePerDay";

      filter[priceField] = {};
      if (minPrice) filter[priceField].$gte = Number(minPrice);
      if (maxPrice) filter[priceField].$lte = Number(maxPrice);
    }

    let sortOption = { featured: -1, rating: -1, createdAt: -1 };
    if (sort === "priceAsc") {
      sortOption = { "rentalPricing.pricePerDay": 1, "transportPricing.baseTripPrice": 1 };
    } else if (sort === "priceDesc") {
      sortOption = { "rentalPricing.pricePerDay": -1, "transportPricing.baseTripPrice": -1 };
    } else if (sort === "seating") {
      sortOption = { seatingCapacity: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate("owner", "name vendorProfile.businessName vendorProfile.city phone")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Vehicle.countDocuments(filter),
    ]);

    // Mask registration numbers for public browsing
    const sanitizedVehicles = vehicles.map((v) => {
      const reg = String(v.registrationNumber || "").trim();
      const maskedReg =
        reg.length > 4 ? `${reg.slice(0, 2)} ** **** ${reg.slice(-4)}` : "** ****";
      return {
        ...v,
        registrationNumber: maskedReg,
      };
    });

    res.json({
      ok: true,
      data: {
        vehicles: sanitizedVehicles,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getVehicles error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getVehicleById(req, res) {
  try {
    await dbConnect();
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("owner", "name email phone vendorProfile.businessName vendorProfile.city vendorProfile.profilePhoto")
      .lean();

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found" });
    }

    // Check if the requester is the owner or admin to unmask registration
    const isOwnerOrAdmin =
      req.user &&
      (String(vehicle.owner?._id) === req.user.id || req.user.role === "admin");

    if (!isOwnerOrAdmin && vehicle.registrationNumber) {
      const reg = String(vehicle.registrationNumber).trim();
      vehicle.registrationNumber =
        reg.length > 4 ? `${reg.slice(0, 2)} ** **** ${reg.slice(-4)}` : "** ****";
    }

    res.json({ ok: true, data: { vehicle } });
  } catch (err) {
    console.error("getVehicleById error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function checkAvailability(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { startDate, endDate, serviceType } = req.query;

    const vehicle = await Vehicle.findById(id).lean();
    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found" });
    }

    if (vehicle.availabilityStatus !== "available") {
      return res.json({
        ok: true,
        data: {
          available: false,
          reason: `Vehicle is currently marked as ${vehicle.availabilityStatus}.`,
        },
      });
    }

    if (serviceType === "RENTAL" || startDate) {
      if (!startDate || !endDate) {
        return res.status(400).json({ ok: false, error: "Start date and end date are required." });
      }

      const result = await checkRentalAvailability(id, startDate, endDate);
      if (!result.available) {
        return res.json({ ok: true, data: { available: false, reason: result.error } });
      }

      // Also compute estimated pricing
      const pricing = calculatePricing(vehicle, "RENTAL", { startDate, endDate });
      return res.json({ ok: true, data: { available: true, pricing } });
    }

    res.json({ ok: true, data: { available: true } });
  } catch (err) {
    console.error("checkAvailability error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ========================================================
// 2. CUSTOMER VEHICLE BOOKING ACTIONS
// ========================================================

export async function createVehicleBooking(req, res) {
  try {
    await dbConnect();
    const { id: vehicleId } = req.params;
    const {
      serviceType, // "RENTAL" | "TRANSPORT"
      rentalDetails,
      transportDetails,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    if (!["RENTAL", "TRANSPORT"].includes(serviceType)) {
      return res.status(400).json({ ok: false, error: "Invalid service type." });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || !vehicle.active) {
      return res.status(404).json({ ok: false, error: "Vehicle not found or inactive." });
    }

    if (vehicle.availabilityStatus !== "available") {
      return res.status(400).json({
        ok: false,
        error: `Vehicle is currently unavailable (${vehicle.availabilityStatus}).`,
      });
    }

    if (!vehicle.supportedServices.includes(serviceType.toLowerCase())) {
      return res.status(400).json({
        ok: false,
        error: `This vehicle does not support ${serviceType.toLowerCase()} service.`,
      });
    }

    const name = customerName || req.user.name;
    const email = customerEmail || req.user.email;
    const phone = customerPhone || req.user.phone;

    if (!name || !email || !phone) {
      return res.status(400).json({ ok: false, error: "Name, email, and phone number are required." });
    }

    let calculatedBreakdown;
    let finalRentalDetails = {};
    let finalTransportDetails = {};

    if (serviceType === "RENTAL") {
      if (!rentalDetails?.startDate || !rentalDetails?.endDate) {
        return res.status(400).json({ ok: false, error: "Rental start and end date/time are required." });
      }

      const start = new Date(rentalDetails.startDate);
      const end = new Date(rentalDetails.endDate);

      if (start < new Date(Date.now() - 5 * 60 * 1000)) {
        return res.status(400).json({ ok: false, error: "Rental start date cannot be in the past." });
      }

      if (end <= start) {
        return res.status(400).json({ ok: false, error: "End date must be after start date." });
      }

      // Check backend availability
      const availCheck = await checkRentalAvailability(vehicleId, start, end);
      if (!availCheck.available) {
        return res.status(409).json({ ok: false, error: availCheck.error });
      }

      calculatedBreakdown = calculatePricing(vehicle, "RENTAL", {
        startDate: start,
        endDate: end,
      });

      finalRentalDetails = {
        startDate: start,
        endDate: end,
        durationHours: calculatedBreakdown.durationHours,
        durationDays: calculatedBreakdown.durationDays,
        pickupLocation: rentalDetails.pickupLocation || vehicle.pickupLocation || "",
        returnLocation: rentalDetails.returnLocation || rentalDetails.pickupLocation || "",
        selfDrive: rentalDetails.selfDrive !== false,
      };
    } else if (serviceType === "TRANSPORT") {
      if (!transportDetails?.travelDate || !transportDetails?.pickupAddress || !transportDetails?.destinationAddress) {
        return res.status(400).json({
          ok: false,
          error: "Travel date, pickup address, and destination address are required.",
        });
      }

      const travelDate = new Date(transportDetails.travelDate);
      if (travelDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        return res.status(400).json({ ok: false, error: "Travel date cannot be in the past." });
      }

      const passengers = Number(transportDetails.passengers || 1);
      if (passengers > vehicle.seatingCapacity) {
        return res.status(400).json({
          ok: false,
          error: `Requested passenger count (${passengers}) exceeds vehicle seating capacity (${vehicle.seatingCapacity}).`,
        });
      }

      calculatedBreakdown = calculatePricing(vehicle, "TRANSPORT", transportDetails);

      finalTransportDetails = {
        tripType: transportDetails.tripType || "one_way",
        travelDate,
        pickupTime: transportDetails.pickupTime || "10:00 AM",
        returnDate: transportDetails.returnDate ? new Date(transportDetails.returnDate) : null,
        returnTime: transportDetails.returnTime || "",
        pickupAddress: transportDetails.pickupAddress,
        destinationAddress: transportDetails.destinationAddress,
        passengers,
        specialNotes: transportDetails.specialNotes || "",
      };
    }

    const bookingRef = generateBookingRef();
    const newBooking = await VehicleBooking.create({
      bookingRef,
      customer: req.user.id,
      vehicle: vehicle._id,
      owner: vehicle.owner,
      serviceType,
      rentalDetails: finalRentalDetails,
      transportDetails: finalTransportDetails,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      priceBreakdown: calculatedBreakdown,
      status: calculatedBreakdown.isQuoteRequired ? "PENDING" : "PENDING",
      paymentStatus: "unpaid",
    });

    // Notify Customer & Owner in background
    sendMail({
      to: email,
      subject: `FlipsAura — Vehicle ${serviceType === "RENTAL" ? "Rental" : "Transport"} Request Placed (${bookingRef})`,
      html: `
        <h2>FlipsAura Vehicle ${serviceType === "RENTAL" ? "Rental" : "Transport"} Request</h2>
        <p>Hi <b>${name}</b>, your request for <b>${vehicle.name}</b> has been placed successfully.</p>
        <p><b>Booking Reference:</b> ${bookingRef}</p>
        <p><b>Estimated Amount:</b> ₹${calculatedBreakdown.totalAmount?.toLocaleString("en-IN") || "Quote Pending"}</p>
        <p>The vehicle provider will review and confirm your request shortly.</p>
      `,
    }).catch((e) => console.error("Customer booking email error:", e.message));

    // Notify Owner
    User.findById(vehicle.owner)
      .select("email name phone")
      .lean()
      .then((ownerUser) => {
        if (ownerUser?.email) {
          sendMail({
            to: ownerUser.email,
            subject: `New FlipsAura Vehicle Booking Request (${bookingRef})`,
            html: `
              <h2>New Booking Request Received!</h2>
              <p>Hi <b>${ownerUser.name || "Provider"}</b>,</p>
              <p>You have a new <b>${serviceType}</b> booking request for <b>${vehicle.name}</b> from <b>${name}</b>.</p>
              <p><b>Booking Ref:</b> ${bookingRef}</p>
              <p>Please log in to your FlipsAura Vendor / Vehicle Dashboard to accept, quote, or decline this booking.</p>
            `,
          }).catch((e) => console.error("Owner booking alert email error:", e.message));
        }
      })
      .catch(() => {});

    res.status(201).json({
      ok: true,
      data: {
        booking: newBooking,
      },
    });
  } catch (err) {
    console.error("createVehicleBooking error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getCustomerVehicleBookings(req, res) {
  try {
    await dbConnect();
    const bookings = await VehicleBooking.find({ customer: req.user.id })
      .populate("vehicle", "name brand model vehicleType images city pickupLocation seatingCapacity")
      .populate("owner", "name phone email vendorProfile.businessName")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, data: { bookings } });
  } catch (err) {
    console.error("getCustomerVehicleBookings error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function cancelCustomerVehicleBooking(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await VehicleBooking.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking not found." });
    }

    if (["CANCELLED", "COMPLETED", "REJECTED"].includes(booking.status)) {
      return res.status(400).json({
        ok: false,
        error: `Cannot cancel a booking that is already ${booking.status.toLowerCase()}.`,
      });
    }

    booking.status = "CANCELLED";
    booking.cancelledBy = "customer";
    booking.cancellationReason = reason || "Cancelled by customer";
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ ok: true, data: { booking } });
  } catch (err) {
    console.error("cancelCustomerVehicleBooking error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function acceptVehicleQuote(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const booking = await VehicleBooking.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking not found." });
    }

    if (booking.status !== "QUOTED") {
      return res.status(400).json({ ok: false, error: "Booking is not in QUOTED state." });
    }

    booking.status = "CONFIRMED";
    booking.confirmedAt = new Date();
    if (booking.priceBreakdown?.quotedAmount) {
      booking.priceBreakdown.totalAmount = booking.priceBreakdown.quotedAmount;
    }
    await booking.save();

    res.json({ ok: true, data: { booking } });
  } catch (err) {
    console.error("acceptVehicleQuote error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ========================================================
// 3. VEHICLE OWNER / PROVIDER ACTIONS
// ========================================================

export async function getOwnerVehicles(req, res) {
  try {
    await dbConnect();
    const vehicles = await Vehicle.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach active bookings count
    const vehicleIds = vehicles.map((v) => v._id);
    const bookingCounts = await VehicleBooking.aggregate([
      { $match: { vehicle: { $in: vehicleIds }, status: { $in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } },
      { $group: { _id: "$vehicle", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    bookingCounts.forEach((b) => {
      countMap[String(b._id)] = b.count;
    });

    const enrichedVehicles = vehicles.map((v) => ({
      ...v,
      activeBookingsCount: countMap[String(v._id)] || 0,
    }));

    res.json({ ok: true, data: { vehicles: enrichedVehicles } });
  } catch (err) {
    console.error("getOwnerVehicles error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function createVehicle(req, res) {
  try {
    await dbConnect();
    const {
      name,
      brand,
      model,
      vehicleType,
      supportedServices,
      registrationNumber,
      seatingCapacity,
      fuelType,
      transmission,
      images,
      description,
      features,
      city,
      pickupLocation,
      serviceArea,
      rentalPricing,
      transportPricing,
    } = req.body;

    if (!brand || !model || !vehicleType || !registrationNumber || !seatingCapacity || !city) {
      return res.status(400).json({
        ok: false,
        error: "Brand, model, vehicle type, registration number, seating capacity, and city are required.",
      });
    }

    const title = name || `${brand} ${model}`;

    const vehicle = await Vehicle.create({
      owner: req.user.id,
      name: title,
      brand,
      model,
      vehicleType,
      supportedServices: supportedServices || ["rental", "transport"],
      registrationNumber,
      seatingCapacity: Number(seatingCapacity),
      fuelType: fuelType || "diesel",
      transmission: transmission || "manual",
      images: images || [],
      description: description || "",
      features: features || [],
      city,
      pickupLocation: pickupLocation || "",
      serviceArea: serviceArea || "",
      rentalPricing: rentalPricing || {},
      transportPricing: transportPricing || {},
      availabilityStatus: "available",
      verificationStatus: req.user.role === "admin" ? "verified" : "pending",
      active: req.user.role === "admin",
    });

    res.status(201).json({ ok: true, data: { vehicle } });
  } catch (err) {
    console.error("createVehicle error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function updateVehicle(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const filter = req.user.role === "admin" ? { _id: id } : { _id: id, owner: req.user.id };
    const vehicle = await Vehicle.findOne(filter);

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found or unauthorized." });
    }

    const allowedFields = [
      "name",
      "brand",
      "model",
      "vehicleType",
      "supportedServices",
      "registrationNumber",
      "seatingCapacity",
      "fuelType",
      "transmission",
      "images",
      "description",
      "features",
      "city",
      "pickupLocation",
      "serviceArea",
      "rentalPricing",
      "transportPricing",
      "availabilityStatus",
      "active",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();
    res.json({ ok: true, data: { vehicle } });
  } catch (err) {
    console.error("updateVehicle error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function toggleVehicleStatus(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { availabilityStatus, active } = req.body;

    const filter = req.user.role === "admin" ? { _id: id } : { _id: id, owner: req.user.id };
    const vehicle = await Vehicle.findOne(filter);

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found." });
    }

    if (availabilityStatus) vehicle.availabilityStatus = availabilityStatus;
    if (active !== undefined) vehicle.active = Boolean(active);

    await vehicle.save();
    res.json({ ok: true, data: { vehicle } });
  } catch (err) {
    console.error("toggleVehicleStatus error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function deleteVehicle(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;

    const filter = req.user.role === "admin" ? { _id: id } : { _id: id, owner: req.user.id };
    const vehicle = await Vehicle.findOneAndUpdate(
      filter,
      { $set: { active: false, availabilityStatus: "disabled" } },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found or unauthorized." });
    }

    res.json({ ok: true, data: { message: "Vehicle deactivated successfully." } });
  } catch (err) {
    console.error("deleteVehicle error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getOwnerBookings(req, res) {
  try {
    await dbConnect();
    const bookings = await VehicleBooking.find({ owner: req.user.id })
      .populate("vehicle", "name brand model vehicleType registrationNumber images city")
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Summary calculations
    let totalEarnings = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let completedCount = 0;

    bookings.forEach((b) => {
      if (b.status === "COMPLETED" || (b.status === "CONFIRMED" && b.paymentStatus === "paid")) {
        totalEarnings += Number(b.priceBreakdown?.totalAmount || 0);
      }
      if (b.status === "PENDING") pendingCount++;
      if (b.status === "CONFIRMED") confirmedCount++;
      if (b.status === "COMPLETED") completedCount++;
    });

    res.json({
      ok: true,
      data: {
        bookings,
        stats: {
          totalBookings: bookings.length,
          totalEarnings,
          pendingCount,
          confirmedCount,
          completedCount,
        },
      },
    });
  } catch (err) {
    console.error("getOwnerBookings error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function respondToVehicleBooking(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { action, notes, quotedAmount } = req.body; // action: "CONFIRM" | "REJECT" | "QUOTE" | "IN_PROGRESS" | "COMPLETE"

    const filter = req.user.role === "admin" ? { _id: id } : { _id: id, owner: req.user.id };
    const booking = await VehicleBooking.findOne(filter);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking request not found." });
    }

    if (action === "CONFIRM") {
      // Re-verify availability to prevent race conditions & double-booking
      if (booking.serviceType === "RENTAL") {
        const availCheck = await checkRentalAvailability(
          booking.vehicle,
          booking.rentalDetails.startDate,
          booking.rentalDetails.endDate,
          booking._id
        );
        if (!availCheck.available) {
          return res.status(409).json({
            ok: false,
            error: `Cannot confirm: ${availCheck.error}`,
          });
        }
      }

      booking.status = "CONFIRMED";
      booking.confirmedAt = new Date();
      booking.ownerResponseNotes = notes || "Booking confirmed by vehicle provider.";
    } else if (action === "REJECT") {
      booking.status = "REJECTED";
      booking.cancelledBy = "owner";
      booking.cancellationReason = notes || "Declined by vehicle provider.";
      booking.cancelledAt = new Date();
    } else if (action === "QUOTE") {
      if (!quotedAmount || Number(quotedAmount) <= 0) {
        return res.status(400).json({ ok: false, error: "A valid quote amount is required." });
      }
      booking.status = "QUOTED";
      booking.priceBreakdown.quotedAmount = Number(quotedAmount);
      booking.priceBreakdown.quoteNotes = notes || "";
      booking.ownerResponseNotes = `Quote of ₹${Number(quotedAmount).toLocaleString("en-IN")} submitted.`;
    } else if (action === "IN_PROGRESS") {
      booking.status = "IN_PROGRESS";
    } else if (action === "COMPLETE") {
      booking.status = "COMPLETED";
      booking.completedAt = new Date();
    } else {
      return res.status(400).json({ ok: false, error: "Invalid action." });
    }

    await booking.save();

    // Notify customer
    sendMail({
      to: booking.customerEmail,
      subject: `FlipsAura — Booking ${booking.bookingRef} Status: ${booking.status}`,
      html: `
        <h2>Update on your Vehicle Booking (${booking.bookingRef})</h2>
        <p>Your booking status is now: <b>${booking.status}</b></p>
        ${notes ? `<p><b>Provider Message:</b> ${notes}</p>` : ""}
        ${action === "QUOTE" ? `<p><b>Quoted Price:</b> ₹${Number(quotedAmount).toLocaleString("en-IN")}. Please log in to your FlipsAura account to accept this quote.</p>` : ""}
      `,
    }).catch((e) => console.error("Booking response email error:", e.message));

    res.json({ ok: true, data: { booking } });
  } catch (err) {
    console.error("respondToVehicleBooking error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ========================================================
// 4. ADMIN ACTIONS (MODERATION & AUDIT)
// ========================================================

export async function getAdminVehicles(req, res) {
  try {
    await dbConnect();
    const { status, verificationStatus, q } = req.query;
    const filter = {};

    if (verificationStatus && verificationStatus !== "all") filter.verificationStatus = verificationStatus;
    if (status && status !== "all") filter.availabilityStatus = status;
    if (q) {
      filter.$or = [
        { name: { $regex: new RegExp(q.trim(), "i") } },
        { brand: { $regex: new RegExp(q.trim(), "i") } },
        { registrationNumber: { $regex: new RegExp(q.trim(), "i") } },
        { city: { $regex: new RegExp(q.trim(), "i") } },
      ];
    }

    const [vehicles, totalCount, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      Vehicle.find(filter)
        .populate("owner", "name email phone vendorProfile.businessName vendorProfile.city")
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ verificationStatus: "pending" }),
      Vehicle.countDocuments({ verificationStatus: "verified" }),
      Vehicle.countDocuments({ verificationStatus: "rejected" }),
    ]);

    res.json({
      ok: true,
      data: {
        vehicles,
        counts: {
          total: totalCount,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
        },
      },
    });
  } catch (err) {
    console.error("getAdminVehicles error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function verifyAdminVehicle(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { verificationStatus, rejectionReason } = req.body;

    if (!["verified", "rejected", "pending"].includes(verificationStatus)) {
      return res.status(400).json({ ok: false, error: "Invalid verification status." });
    }

    const updateFields = {
      verificationStatus,
      rejectionReason: verificationStatus === "rejected" ? (rejectionReason || "Listing rejected by administrator.") : "",
      active: verificationStatus === "verified",
    };

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).populate("owner", "name email phone vendorProfile.businessName");

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "Vehicle not found." });
    }

    // Email notification to vehicle owner
    if (vehicle.owner?.email) {
      const isApproved = verificationStatus === "verified";
      sendMail({
        to: vehicle.owner.email,
        subject: `FlipsAura — Vehicle ${vehicle.name} ${isApproved ? "Approved & Live!" : "Moderation Update"}`,
        html: `
          <h2>Vehicle Verification Status Update</h2>
          <p>Hello <b>${vehicle.owner.name}</b>,</p>
          <p>Your vehicle listing <b>${vehicle.brand} ${vehicle.model} (${vehicle.name})</b> has been reviewed by the FlipsAura Admin Team.</p>
          <p>Status: <b style="color: ${isApproved ? '#059669' : '#DC2626'}">${verificationStatus.toUpperCase()}</b></p>
          ${
            isApproved
              ? `<p>🎉 Your vehicle is now active and live for customer rentals and transport bookings on FlipsAura!</p>`
              : rejectionReason
              ? `<p><b>Reason:</b> ${rejectionReason}</p><p>Please log in to your vendor dashboard to update your vehicle details.</p>`
              : ""
          }
        `,
      }).catch((e) => console.error("Vehicle verification email failed:", e.message));
    }

    res.json({ ok: true, data: { vehicle } });
  } catch (err) {
    console.error("verifyAdminVehicle error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getAdminVehicleBookings(req, res) {
  try {
    await dbConnect();
    const { status, serviceType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType.toUpperCase();

    const bookings = await VehicleBooking.find(filter)
      .populate("vehicle", "name brand model vehicleType registrationNumber images city")
      .populate("owner", "name email phone vendorProfile.businessName")
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, data: { bookings } });
  } catch (err) {
    console.error("getAdminVehicleBookings error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function updateAdminVehicleBookingStatus(req, res) {
  try {
    await dbConnect();
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;

    const booking = await VehicleBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking not found." });
    }

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (notes) booking.ownerResponseNotes = notes;

    await booking.save();
    res.json({ ok: true, data: { booking } });
  } catch (err) {
    console.error("updateAdminVehicleBookingStatus error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
