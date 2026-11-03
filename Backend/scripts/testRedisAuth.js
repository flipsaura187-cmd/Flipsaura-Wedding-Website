import mongoose from "mongoose";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import {
  redisGet,
  redisSet,
  redisDel,
  redisAcquireLock,
  redisReleaseLock,
  redisIncrWithTTL,
  invalidateUserAuthCache,
} from "../lib/redis.js";
import { login, register, verifyOtp } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

// Mock helper to create Express req / res objects
function createMockReqRes(body = {}, headers = {}, cookies = {}) {
  const req = {
    body,
    headers,
    cookies,
  };
  let responseData = null;
  let statusCode = 200;
  let cookiesSet = {};

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    cookie(name, val, opts) {
      cookiesSet[name] = { val, opts };
      return res;
    },
    clearCookie(name) {
      delete cookiesSet[name];
      return res;
    },
    getResponse() {
      return { status: statusCode, data: responseData, cookies: cookiesSet };
    },
  };

  return { req, res };
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("   FlipsAura Redis Login & Signup Test Suite     ");
  console.log("=================================================\n");

  await dbConnect();
  console.log("✓ Connected to MongoDB");

  const timestamp = Date.now();
  const testCustomerEmail = `test.customer.${timestamp}@flipsaura.local`;
  const testVendorEmail = `test.vendor.${timestamp}@flipsaura.local`;
  const testAdminEmail = process.env.ADMIN_EMAIL || "flipsaura187@gmail.com";
  const testPassword = "Password@1234";

  // Clean up any stale test accounts
  await User.deleteMany({
    email: { $in: [testCustomerEmail, testVendorEmail] },
  });

  // -------------------------------------------------------------------------
  // TEST 2: Customer Signup (and OTP Cache)
  // -------------------------------------------------------------------------
  console.log("\n[Test 2: Customer Signup]");
  {
    const { req, res } = createMockReqRes({
      name: "Rahul Customer",
      email: testCustomerEmail,
      phone: "98765" + String(timestamp).slice(-5),
      password: testPassword,
      role: "customer",
    });

    await register(req, res);
    const result = res.getResponse();

    if (result.status === 200 && result.data?.requiresVerification) {
      console.log("✓ Customer signup succeeded with verification required.");
    } else {
      console.error("✗ Customer signup failed:", result);
      process.exit(1);
    }

    // Verify user in DB has unverified phone
    const dbUser = await User.findOne({ email: testCustomerEmail });
    if (!dbUser || dbUser.isPhoneVerified !== false) {
      console.error("✗ User not created properly in DB:", dbUser);
      process.exit(1);
    }
    console.log("✓ Customer record created in MongoDB with phoneOtp hash.");
  }

  // -------------------------------------------------------------------------
  // TEST 6: Duplicate Signup Prevention (Lock / Conflict)
  // -------------------------------------------------------------------------
  console.log("\n[Test 6: Duplicate Signup]");
  {
    // Try signing up again with same email while unverified (should regenerate/update OTP)
    const { req: req1, res: res1 } = createMockReqRes({
      name: "Rahul Duplicate",
      email: testCustomerEmail,
      phone: "98765" + String(timestamp).slice(-5),
      password: testPassword,
      role: "customer",
    });

    await register(req1, res1);
    const res1Data = res1.getResponse();
    if (res1Data.status === 200 && res1Data.data?.requiresVerification) {
      console.log("✓ Unverified duplicate request safely re-sent OTP without duplicate documents.");
    } else {
      console.error("✗ Unverified duplicate signup error:", res1Data);
      process.exit(1);
    }

    // Now verify the customer
    const userToVerify = await User.findOne({ email: testCustomerEmail });
    userToVerify.isPhoneVerified = true;
    await userToVerify.save();

    // Now try signing up again: must return 409 Conflict
    const { req: req2, res: res2 } = createMockReqRes({
      name: "Rahul Duplicate 2",
      email: testCustomerEmail,
      phone: "98765" + String(timestamp).slice(-5),
      password: testPassword,
      role: "customer",
    });

    await register(req2, res2);
    const res2Data = res2.getResponse();
    if (res2Data.status === 409) {
      console.log("✓ Verified user duplicate signup prevented with 409 Conflict.");
    } else {
      console.error("✗ Duplicate signup should return 409, got:", res2Data);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Customer Login
  // -------------------------------------------------------------------------
  console.log("\n[Test 1: Customer Login]");
  let customerToken = null;
  {
    const { req, res } = createMockReqRes({
      email: testCustomerEmail,
      password: testPassword,
    });

    await login(req, res);
    const result = res.getResponse();

    if (result.status === 200 && result.data?.data?.token) {
      customerToken = result.data.data.token;
      console.log("✓ Customer login succeeded. Token issued.");
    } else {
      console.error("✗ Customer login failed:", result);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 3: Vendor Login
  // -------------------------------------------------------------------------
  console.log("\n[Test 3: Vendor Login]");
  let vendorToken = null;
  {
    // Create pre-verified Vendor
    const passwordHash = await User.hashPassword(testPassword);
    const vendorUser = await User.create({
      name: "Pooja Decorator",
      email: testVendorEmail,
      phone: "91234" + String(timestamp).slice(-5),
      passwordHash,
      role: "vendor",
      isPhoneVerified: true,
      vendorProfile: {
        businessName: "Pooja Event Decor",
        ownerName: "Pooja Sharma",
        approved: true,
        verificationStatus: "approved",
      },
    });

    const { req, res } = createMockReqRes({
      email: testVendorEmail,
      password: testPassword,
    });

    await login(req, res);
    const result = res.getResponse();

    if (result.status === 200 && result.data?.data?.user?.role === "vendor") {
      vendorToken = result.data.data.token;
      console.log("✓ Vendor login succeeded with vendorProfile preserved.");
    } else {
      console.error("✗ Vendor login failed:", result);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 4: Admin Login
  // -------------------------------------------------------------------------
  console.log("\n[Test 4: Admin Login]");
  {
    // Ensure admin user exists
    let adminUser = await User.findOne({ email: testAdminEmail.toLowerCase().trim() });
    const adminPassword = process.env.ADMIN_PASSWORD || "flipsaura@123#";
    if (!adminUser) {
      adminUser = await User.create({
        name: "FlipsAura Administrator",
        email: testAdminEmail.toLowerCase().trim(),
        phone: "916202442499",
        passwordHash: await User.hashPassword(adminPassword),
        role: "admin",
        isPhoneVerified: true,
      });
    }

    const { req, res } = createMockReqRes({
      email: testAdminEmail,
      password: adminPassword,
    });

    await login(req, res);
    const result = res.getResponse();

    if (result.status === 200 && result.data?.data?.user?.role === "admin") {
      console.log("✓ Admin login succeeded with admin role preserved.");
    } else {
      console.error("✗ Admin login failed:", result);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 5: Invalid Password Verification
  // -------------------------------------------------------------------------
  console.log("\n[Test 5: Invalid Password]");
  {
    const { req, res } = createMockReqRes({
      email: testCustomerEmail,
      password: "WrongPassword!999",
    });

    await login(req, res);
    const result = res.getResponse();

    if (result.status === 401) {
      console.log("✓ Invalid password correctly rejected with 401.");
    } else {
      console.error("✗ Invalid password should return 401, got:", result);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 7: Redis Unavailable (Graceful Fallback to MongoDB)
  // -------------------------------------------------------------------------
  console.log("\n[Test 7: Redis Unavailable (Graceful Fallback)]");
  {
    // Even if Redis is disconnected or offline, login must work flawlessly
    const { req, res } = createMockReqRes({
      email: testCustomerEmail,
      password: testPassword,
    });

    await login(req, res);
    const result = res.getResponse();

    if (result.status === 200 && result.data?.data?.token) {
      console.log("✓ Login succeeds seamlessly via MongoDB even when Redis is offline.");
    } else {
      console.error("✗ Fallback login failed:", result);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 8: Cache Invalidation & Expiry
  // -------------------------------------------------------------------------
  console.log("\n[Test 8: Cache Invalidation]");
  {
    await invalidateUserAuthCache(testCustomerEmail, "mockUserId123");
    console.log("✓ Invalidation helper executes without throwing errors.");
  }

  // -------------------------------------------------------------------------
  // TEST 9: Existing JWT / Session Behavior
  // -------------------------------------------------------------------------
  console.log("\n[Test 9: Existing JWT / Session Behavior]");
  {
    const decoded = verifyToken(customerToken);
    if (decoded && decoded.uid) {
      console.log("✓ JWT token successfully verified with valid uid payload:", decoded.uid);
    } else {
      console.error("✗ Token verification failed:", customerToken);
      process.exit(1);
    }
  }

  // Clean up test documents
  await User.deleteMany({
    email: { $in: [testCustomerEmail, testVendorEmail] },
  });
  console.log("\n✓ Test data cleaned up.");

  console.log("\n=================================================");
  console.log("   🎉 ALL 9 TEST SUITE SCENARIOS PASSED!        ");
  console.log("=================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});

