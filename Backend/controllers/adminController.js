import { dbConnect } from "../lib/db.js";
import User from "../models/User.js";
import Item from "../models/Item.js";
import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import Blog from "../models/Blog.js";

export async function getAdminStats(req, res) {
  await dbConnect();

  const [users, items, bookings, categories, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Booking.countDocuments(),
    Category.countDocuments(),
    Booking.aggregate([
      { $match: { status: { $in: ["paid", "confirmed", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    ok: true,
    data: {
      stats: {
        users,
        items,
        bookings,
        categories,
        revenue: revenueAgg[0]?.total || 0,
      },
    },
  });
}

export async function getUsers(req, res) {
  await dbConnect();
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, data: { users } });
}

export async function updateUser(req, res) {
  const { id, role, approved } = req.body;
  await dbConnect();

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ ok: false, error: "Not found" });

  if (role) user.role = role;
  if (typeof approved === "boolean" && user.role === "vendor") {
    user.vendorProfile = { ...(user.vendorProfile || {}), approved };
  }

  await user.save();
  res.json({
    ok: true,
    data: {
      user: {
        id: String(user._id),
        role: user.role,
        approved: user.vendorProfile?.approved,
      },
    },
  });
}

export async function getAdminBlogs(req, res) {
  await dbConnect();
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
}

export async function getVendorStats(req, res) {
  await dbConnect();

  const [items, bookings, revenueAgg] = await Promise.all([
    Item.countDocuments({ vendor: req.user.id }),
    Booking.countDocuments({ vendor: req.user.id }),
    Booking.aggregate([
      { $match: { vendor: req.user.id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    ok: true,
    data: {
      stats: {
        items,
        bookings,
        revenue: revenueAgg[0]?.total || 0,
      },
    },
  });
}
