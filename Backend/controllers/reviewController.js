import { dbConnect } from "../lib/db.js";
import Review from "../models/Review.js";
import Item from "../models/Item.js";

export async function getReviews(req, res) {
  const { itemId } = req.query;
  if (!itemId) return res.status(400).json({ ok: false, error: "itemId required" });

  await dbConnect();
  const reviews = await Review.find({ item: itemId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ ok: true, data: { reviews } });
}

export async function createReview(req, res) {
  const { itemId, rating, comment } = req.body;
  if (!itemId || !rating) {
    return res.status(400).json({ ok: false, error: "itemId & rating required" });
  }

  await dbConnect();
  const review = await Review.create({
    item: itemId,
    user: req.user.id,
    name: req.user.name,
    rating,
    comment,
  });

  const agg = await Review.aggregate([
    { $match: { item: review.item } },
    { $group: { _id: "$item", avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);

  if (agg[0]) {
    await Item.findByIdAndUpdate(itemId, {
      rating: agg[0].avg,
      reviewsCount: agg[0].n,
    });
  }

  res.json({ ok: true, data: { review } });
}
