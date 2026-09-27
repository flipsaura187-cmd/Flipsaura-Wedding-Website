import "dotenv/config";
import bcrypt from "bcryptjs";
import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "flipsaura187@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable is not defined!");
    console.error("Please set ADMIN_PASSWORD in your Backend/.env file before running seed:admin.");
    process.exit(1);
  }

  try {
    await dbConnect();
    console.log("Connected to MongoDB for admin seeding...");

    const existingUser = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingUser) {
      console.log(`ℹ️ User with email ${adminEmail} already exists.`);
      existingUser.role = "admin";
      existingUser.passwordHash = hashedPassword;
      if (!existingUser.name || existingUser.name === "User") {
        existingUser.name = "FlipsAura Admin";
      }
      await existingUser.save();
      console.log(`✅ Admin account updated successfully:`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role:  ${existingUser.role}`);
      console.log(`   Password: [UPDATED FROM ADMIN_PASSWORD]`);
    } else {
      const newAdmin = await User.create({
        name: "FlipsAura Admin",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
      });
      console.log(`✅ Admin account created successfully:`);
      console.log(`   ID:    ${newAdmin._id}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role:  ${newAdmin.role}`);
      console.log(`   Password: [SET FROM ADMIN_PASSWORD]`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin account:", error);
    process.exit(1);
  }
}

seedAdmin();
