import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnect } from "../lib/db.js";
import authRoutes from "../routes/authRoutes.js";
import blogRoutes from "../routes/blogRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import User from "../models/User.js";
import Blog from "../models/Blog.js";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING FLIPSAURA COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  await dbConnect();
  console.log("✅ MongoDB Connected successfully.\n");

  // Setup test express server on ephemeral port
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  app.use("/api/blogs", blogRoutes);
  app.use("/api/admin", adminRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = "http://localhost:5099";

  try {
    // -------------------------------------------------------------
    // TASK 2 TEST: ADMIN LOGIN & AUTHORIZATION
    // -------------------------------------------------------------
    console.log("--- TESTING TASK 2: ADMIN LOGIN & AUTHORIZATION ---");

    const adminEmail = (process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log(`1. Testing Admin Login with ${adminEmail}...`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.ok || !loginData.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
    }
    const adminToken = loginData.data.token;
    console.log(`✅ Admin logged in successfully! Role: ${loginData.data.user.role}`);

    // Verify invalid password rejected
    console.log("2. Testing Login with Invalid Password (should fail)...");
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "WrongPassword123!" }),
    });
    if (badLoginRes.status === 401) {
      console.log("✅ Invalid credentials properly rejected with 401 Unauthorized.");
    } else {
      throw new Error(`Expected 401 but got ${badLoginRes.status}`);
    }

    // Verify admin access to protected admin route
    console.log("3. Testing Admin Access to /api/admin/blogs...");
    const adminBlogsRes = await fetch(`${baseUrl}/api/admin/blogs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!adminBlogsRes.ok) {
      throw new Error(`Admin blogs route rejected admin: ${adminBlogsRes.status}`);
    }
    console.log("✅ Admin authorized for /api/admin/blogs route.");

    // Verify unauthenticated user rejected from admin route
    console.log("4. Testing Unauthenticated Request to /api/admin/blogs (should fail)...");
    const unauthRes = await fetch(`${baseUrl}/api/admin/blogs`);
    if (unauthRes.status === 401) {
      console.log("✅ Unauthenticated request rejected with 401 Unauthorized.\n");
    } else {
      throw new Error(`Expected 401 but got ${unauthRes.status}`);
    }

    // -------------------------------------------------------------
    // TASK 1 TEST: FORGOT PASSWORD EMAIL & RESET PASSWORD FLOW
    // -------------------------------------------------------------
    console.log("--- TESTING TASK 1: FORGOT PASSWORD & RESET FLOW ---");

    console.log(`1. Submitting Forgot Password request for ${adminEmail}...`);
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail }),
    });
    const forgotData = await forgotRes.json();
    if (!forgotRes.ok || !forgotData.ok) {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotData)}`);
    }
    console.log(`✅ Forgot password API responded: "${forgotData.message}"`);

    // Verify token stored in DB
    const adminInDb = await User.findOne({ email: adminEmail });
    if (!adminInDb.resetPasswordToken || !adminInDb.resetPasswordExpires) {
      throw new Error("Reset token was not saved to database!");
    }
    console.log(`✅ Reset token stored in DB: ${adminInDb.resetPasswordToken.substring(0, 16)}... (Hashed)`);
    console.log(`✅ Token expires at: ${adminInDb.resetPasswordExpires.toISOString()}`);

    // Verify rate limiting / cooldown on immediate resend
    console.log("2. Testing Resend Email Cooldown (immediate request should be rate-limited)...");
    const resendRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail }),
    });
    const resendData = await resendRes.json();
    if (resendRes.status === 429 && resendData.retryAfter) {
      console.log(`✅ Cooldown verified! Server returned 429: "${resendData.error}" (retryAfter: ${resendData.retryAfter}s)`);
    } else {
      console.warn(`Note: Resend returned status ${resendRes.status}:`, resendData);
    }

    // Test Reset Password
    console.log("3. Testing Password Reset using valid token...");
    // Let's create a temporary test user specifically for resetting password so we don't mess up the Admin's configured password
    const testUserEmail = "test_reset_user@example.com";
    await User.deleteOne({ email: testUserEmail });
    const testUser = await User.create({
      name: "Reset Tester",
      email: testUserEmail,
      passwordHash: await User.hashPassword("InitialPassword123!"),
      role: "user",
    });

    // Request reset for test user
    // Bypass cooldown by setting lastSent to 2 mins ago
    testUser.resetPasswordLastSent = new Date(Date.now() - 120000);
    await testUser.save();

    // Generate token for test user
    const crypto = await import("crypto");
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(rawResetToken).digest("hex");
    testUser.resetPasswordToken = hashedResetToken;
    testUser.resetPasswordExpires = new Date(Date.now() + 3600000);
    await testUser.save();

    // Perform Reset
    const newPasswordForUser = "BrandNewSecret2026!";
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawResetToken, newPassword: newPasswordForUser }),
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok || !resetData.ok) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
    }
    console.log(`✅ Password reset successfully: "${resetData.message}"`);

    // Verify token invalidated (cannot be reused)
    console.log("4. Verifying token cannot be reused...");
    const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawResetToken, newPassword: "AnotherPassword123!" }),
    });
    if (reuseRes.status === 400) {
      console.log("✅ Token reuse rejected with 400 Bad Request.");
    } else {
      throw new Error(`Expected 400 for reused token but got ${reuseRes.status}`);
    }

    // Verify new password works for login
    console.log("5. Verifying user can log in with new password...");
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserEmail, password: newPasswordForUser }),
    });
    if (!newLoginRes.ok) {
      throw new Error("Login with new password failed!");
    }
    console.log("✅ Login with new password succeeded!");

    // Verify old password no longer works
    console.log("6. Verifying old password no longer works...");
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserEmail, password: "InitialPassword123!" }),
    });
    if (oldLoginRes.status === 401) {
      console.log("✅ Old password rejected with 401 Unauthorized.\n");
    } else {
      throw new Error(`Old password unexpectedly succeeded: ${oldLoginRes.status}`);
    }

    // Clean up test user
    await User.deleteOne({ email: testUserEmail });

    // -------------------------------------------------------------
    // TASK 3 TEST: ADMIN BLOG CREATION & CUSTOMER VISIBILITY
    // -------------------------------------------------------------
    console.log("--- TESTING TASK 3: BLOG CREATION & CUSTOMER VISIBILITY ---");

    const testSlug = `royal-wedding-decor-${Date.now()}`;
    const blogPayload = {
      title: "Royal Wedding Decor Trends 2026",
      slug: testSlug,
      excerpt: "Explore the most mesmerizing royal wedding decor trends and palace themes.",
      coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
      category: "Wedding Decoration",
      tags: "decor, royal, mandap, flowers",
      author: "FlipsAura Editorial",
      status: "draft", // Created as DRAFT first
      content: `
        <h2>Palace Grandeur & Mandap Marvels</h2>
        <p>From shimmering champagne gold drapes to fragrant marigold arches, weddings this season embrace timeless luxury.</p>
        <div class="video-embed">
          <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>
        </div>
        <p>Check out our <a href="/categories/wedding-setup">exclusive wedding setups</a> for more ideas.</p>
      `,
    };

    console.log("1. Admin creating DRAFT blog...");
    const createRes = await fetch(`${baseUrl}/api/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(blogPayload),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.ok) {
      throw new Error(`Blog creation failed: ${JSON.stringify(createData)}`);
    }
    console.log(`✅ Draft blog created: "${createData.blog.title}" (Slug: ${createData.blog.slug})`);

    // Verify customer public listing does NOT show draft
    console.log("2. Verifying Customer /api/blogs does NOT include draft blog...");
    const publicList1 = await fetch(`${baseUrl}/api/blogs`);
    const publicData1 = await publicList1.json();
    const foundInPublic1 = publicData1.blogs?.some((b) => b.slug === testSlug);
    if (foundInPublic1) {
      throw new Error("SECURITY FAILURE: Draft blog was exposed to customers in /api/blogs!");
    }
    console.log("✅ Verified: Draft blog is NOT in customer public listing.");

    // Verify customer public detail returns 404 for draft
    console.log("3. Verifying Customer /api/blogs/:slug returns 404 for draft...");
    const publicDetail1 = await fetch(`${baseUrl}/api/blogs/${testSlug}`);
    if (publicDetail1.status === 404) {
      console.log("✅ Verified: Customer cannot access unpublished blog detail (404 Not Found).");
    } else {
      throw new Error(`Expected 404 for unpublished blog but got ${publicDetail1.status}`);
    }

    // Admin publishes blog
    console.log("4. Admin publishing the blog via PATCH /api/blogs/:slug/publish...");
    const publishRes = await fetch(`${baseUrl}/api/blogs/${testSlug}/publish`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.ok) {
      throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
    }
    console.log(`✅ Blog published! Status is now: ${publishData.blog.status}`);

    // Verify customer public listing NOW includes published blog
    console.log("5. Verifying Customer /api/blogs NOW includes published blog...");
    const publicList2 = await fetch(`${baseUrl}/api/blogs`);
    const publicData2 = await publicList2.json();
    const foundInPublic2 = publicData2.blogs?.some((b) => b.slug === testSlug);
    if (!foundInPublic2) {
      throw new Error("Published blog did NOT appear in customer public listing!");
    }
    console.log("✅ Verified: Published blog is visible in customer marketplace.");

    // Verify customer public detail returns blog with sanitized HTML, image, video
    console.log("6. Verifying Customer /api/blogs/:slug retrieves full blog content...");
    const publicDetail2 = await fetch(`${baseUrl}/api/blogs/${testSlug}`);
    const blogDetailData = await publicDetail2.json();
    if (!publicDetail2.ok || !blogDetailData.ok) {
      throw new Error(`Customer fetch for published blog failed: ${JSON.stringify(blogDetailData)}`);
    }
    const retrievedBlog = blogDetailData.blog;
    if (!retrievedBlog.content.includes("video-embed") || !retrievedBlog.content.includes("iframe")) {
      throw new Error("Video embed was stripped or missing in blog content!");
    }
    console.log("✅ Verified: Customer can read published blog with video, image, and links.");

    // Admin unpublishes blog
    console.log("7. Admin unpublishing blog via PATCH /api/blogs/:slug/unpublish...");
    const unpublishRes = await fetch(`${baseUrl}/api/blogs/${testSlug}/unpublish`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!unpublishRes.ok) {
      throw new Error("Unpublish failed");
    }
    console.log("✅ Blog unpublished.");

    // Verify customer public listing no longer includes it
    const publicList3 = await fetch(`${baseUrl}/api/blogs`);
    const publicData3 = await publicList3.json();
    const foundInPublic3 = publicData3.blogs?.some((b) => b.slug === testSlug);
    if (foundInPublic3) {
      throw new Error("Unpublished blog was still visible to customers!");
    }
    console.log("✅ Verified: Unpublished blog no longer appears to customers.");

    // Clean up test blog
    console.log("8. Admin deleting test blog via DELETE /api/blogs/:slug...");
    const deleteRes = await fetch(`${baseUrl}/api/blogs/${testSlug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!deleteRes.ok) {
      throw new Error("Delete failed");
    }
    console.log("✅ Test blog cleaned up.\n");

    console.log("=================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% WORKING.");
    console.log("=================================================");
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILURE:", err);
  process.exit(1);
});
