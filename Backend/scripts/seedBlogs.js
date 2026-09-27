import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Blog from "../models/Blog.js";

async function seedSampleBlogs() {
  await dbConnect();

  const count = await Blog.countDocuments();
  if (count > 0) {
    console.log(`ℹ️ Database already has ${count} blog(s). Skipping sample seed.`);
    process.exit(0);
  }

  const sampleBlog = {
    title: "10 Most Breathtaking Wedding Decoration Trends for 2026",
    slug: "10-most-breathtaking-wedding-decoration-trends-2026",
    excerpt: "From celestial fairy-light canopies to regal palace mandaps, discover the top wedding decor trends shaping 2026 celebrations.",
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    featuredImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    category: "Wedding Decoration",
    tags: ["decor", "mandap", "trends", "palace", "lighting"],
    author: "FlipsAura Editorial",
    status: "published",
    publishedAt: new Date(),
    content: `
      <h2>1. The Rise of Regal Heritage & Palace Mandaps</h2>
      <p>Couples are falling in love with traditional royal arches, intricately carved pillars, and rich velvet drapes in shades of deep wine, crimson, and antique gold. Heritage aesthetics evoke a sense of timeless majesty that photographs breathtakingly.</p>
      
      <figure class="blog-img">
        <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&q=80" alt="Majestic Floral Mandap Setup" style="width:100%;border-radius:12px;margin:20px 0;" />
        <figcaption style="font-size:13px;color:#777;text-align:center;">Floral elegance with cascading white orchids and marigold accents.</figcaption>
      </figure>

      <h2>2. Celestial Fairy-Light Canopies</h2>
      <p>For evening receptions and sangeet nights, warm string lighting suspended like a starlit galaxy creates an unforgettable romantic ambiance. Paired with soft candlelit dining setups, this trend turns outdoor lawns into magical wonderlands.</p>

      <blockquote style="border-left:4px solid #8B1E3F;background:#FFF5F9;padding:16px 20px;border-radius:0 12px 12px 0;margin:24px 0;font-style:italic;color:#444;">
        "Great wedding decor isn't just about what you see; it's about the atmosphere that envelops your guests the second they arrive."
      </blockquote>

      <h2>3. Watch: Dream Wedding Setup Walkthrough</h2>
      <p>Take inspiration from this stunning bridal walkthrough and mandap design:</p>
      <div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px;margin:24px 0;box-shadow:0 6px 24px rgba(0,0,0,0.12);">
        <iframe src="https://www.youtube.com/embed/fI6Q7t6j5kE" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>

      <h2>4. Sustainable & Living Floral Installations</h2>
      <p>Eco-conscious couples are choosing potted botanical plants, reusable brass props, and locally sourced blooms that can be repurposed after the ceremonies. It's a gorgeous, conscious statement that feels fresh and modern.</p>

      <p>Looking for verified decorators and wedding planners in your city? Explore our <a href="/categories/planning-decor">Planning & Decor Services</a> or connect with top vendors on FlipsAura!</p>
    `,
  };

  const blog = await Blog.create(sampleBlog);
  console.log(`✅ Seeded sample wedding blog: "${blog.title}" (${blog.slug})`);
  process.exit(0);
}

seedSampleBlogs().catch((err) => {
  console.error("Failed to seed sample blogs:", err);
  process.exit(1);
});
