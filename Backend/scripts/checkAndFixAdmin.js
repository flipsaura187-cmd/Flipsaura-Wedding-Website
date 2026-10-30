import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";

async function main() {
  await dbConnect();
  const users = await User.find({
    email: /flipsaura/i,
  }).select("name email role vendorProfile");

  console.log("Found users with flipsaura email:");
  for (const u of users) {
    console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Business: ${u.vendorProfile?.businessName}`);
  }

  // Also check if any admin user exists
  const allAdmins = await User.find({ role: "admin" }).select("name email role");
  console.log("All users with role 'admin':", allAdmins);

  const adminEmail = (process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").trim().toLowerCase();
  const targetUser = await User.findOne({ email: adminEmail });
  if (targetUser) {
    console.log(`Target user ${adminEmail} current role: ${targetUser.role}`);
    if (targetUser.role !== "admin") {
      targetUser.role = "admin";
      await targetUser.save();
      console.log(`UPDATED ${adminEmail} to role: 'admin' successfully!`);
    }
  } else {
    console.log(`User ${adminEmail} not found in database!`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

