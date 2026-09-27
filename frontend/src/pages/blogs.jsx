"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";

const CATEGORIES = [
  "All",
  "Wedding Planning",
  "Wedding Decoration",
  "Mehndi & Henna",
  "Bridal Fashion & Makeup",
  "Groom Wear & Accessories",
  "Photography & Videography",
  "Venues & Destinations",
  "Budget & Timeline",
  "Wedding Trends",
];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = `/api/blogs?page=${page}`;
    if (category && category !== "All") {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.blogs || data?.data || [];
        setBlogs(list);
        setTotalPages(data?.totalPages || 1);
      })
      .catch((err) => {
        console.error("Failed to load blogs:", err);
        setBlogs([]);
      })
      .finally(() => setLoading(false));
  }, [page, category, search]);

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <section className="section" style={{ minHeight: "75vh", padding: "48px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 40px" }}>
          <span
            className="eyebrow"
            style={{
              display: "inline-block",
              background: "#FFF0F5",
              color: "var(--pink-700, #b32a68)",
              padding: "6px 16px",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.5px",
              marginBottom: 12,
            }}
          >
            FLIPSAURA JOURNAL
          </span>
          <h1 style={{ fontSize: "2.4rem", margin: "0 0 14px", color: "var(--wine, #8B1E3F)" }}>
            Wedding Stories & Inspiration
          </h1>
          <p style={{ color: "#666", fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Expert planning tips, breathtaking decor trends, real wedding features, and vendor spotlights to make your big day unforgettable.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ maxWidth: 460, margin: "0 auto 20px" }}>
            <input
              type="text"
              placeholder="Search wedding stories, trends, decor…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 50,
                border: "1px solid #E0D4CD",
                background: "#FAF8F5",
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                outline: "none",
              }}
            />
          </div>

          {/* Category Chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: category === cat ? "1px solid var(--wine, #8B1E3F)" : "1px solid #EAE0D7",
                  background: category === cat ? "var(--wine, #8B1E3F)" : "#fff",
                  color: category === cat ? "#fff" : "#444",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Cards Grid */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#888", fontSize: 16 }}>
            Loading inspiring stories…
          </div>
        ) : blogs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#FAF8F5",
              borderRadius: 16,
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: 44 }}>✨</span>
            <h3 style={{ margin: "14px 0 8px", color: "var(--wine, #8B1E3F)" }}>No articles found</h3>
            <p style={{ color: "#666", fontSize: 14, margin: "0 0 16px" }}>
              {search || category !== "All"
                ? "Try adjusting your search query or selecting a different category."
                : "New wedding inspiration articles will appear here once published."}
            </p>
            {(search || category !== "All") && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setPage(1);
                }}
                style={{ padding: "8px 18px", border: "1px solid #ccc", borderRadius: 8 }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 28,
            }}
          >
            {blogs.map((blog) => {
              const img = blog.coverImage || blog.featuredImage;

              return (
                <Link
                  href={`/blogs/${blog.slug}`}
                  key={blog._id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #F0E6DE",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,30,63,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.04)";
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: 210, background: "#FAF8F5", overflow: "hidden" }}>
                    {img ? (
                      <img
                        src={img}
                        alt={blog.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #FFF0F5, #FFE4E1)", color: "var(--wine, #8B1E3F)", fontSize: 32 }}>
                        💍
                      </div>
                    )}
                    {blog.category && (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          background: "rgba(255,255,255,0.92)",
                          color: "var(--wine, #8B1E3F)",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 20,
                          backdropFilter: "blur(4px)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {blog.category}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently Published"}{" "}
                      • {blog.author || "FlipsAura"}
                    </div>

                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: 18,
                        lineHeight: 1.4,
                        color: "#222",
                        fontWeight: 700,
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {blog.title}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 16px",
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "#666",
                        flex: 1,
                      }}
                    >
                      {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]+>/g, " ").slice(0, 110) + "..." : "")}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", color: "var(--wine, #8B1E3F)", fontSize: 13, fontWeight: 600 }}>
                      <span>Read Story</span>
                      <span style={{ marginLeft: 6 }}>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="pagination"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 48,
            }}
          >
            <button
              disabled={page === 1}
              onClick={() => {
                setPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: page === 1 ? "#fafafa" : "#fff",
                cursor: page === 1 ? "not-allowed" : "pointer",
                color: page === 1 ? "#bbb" : "#333",
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: 14, color: "#666" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: page === totalPages ? "#fafafa" : "#fff",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                color: page === totalPages ? "#bbb" : "#333",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}