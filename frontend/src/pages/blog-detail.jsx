"use client";
import { useEffect, useState } from "react";
import { useParams } from "@/compat/navigation";
import Link from "@/compat/Link";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    fetch(`/api/blogs/${slug}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Article not found");
        setBlog(j.blog || j.data || j);
      })
      .catch((err) => {
        console.error("Failed to load article:", err);
        setError(err.message || "Article not found or not published");
        setBlog(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section className="section" style={{ minHeight: "60vh", padding: "80px 0", textAlign: "center" }}>
        <div className="container">
          <p style={{ color: "#888", fontSize: 16 }}>Loading wedding story…</p>
        </div>
      </section>
    );
  }

  if (error || !blog) {
    return (
      <section className="section" style={{ minHeight: "60vh", padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: 600, textAlign: "center" }}>
          <span style={{ fontSize: 44 }}>📖</span>
          <h1 style={{ fontSize: 28, margin: "16px 0 8px", color: "var(--wine, #8B1E3F)" }}>
            Story Not Found
          </h1>
          <p style={{ color: "#666", marginBottom: 24, fontSize: 15 }}>
            This article might have been moved, unpublished, or the link may be outdated.
          </p>
          <Link
            href="/blogs"
            className="btn btn-primary"
            style={{
              display: "inline-block",
              background: "var(--wine, #8B1E3F)",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            ← Explore Other Wedding Stories
          </Link>
        </div>
      </section>
    );
  }

  const coverImg = blog.coverImage || blog.featuredImage;

  return (
    <article className="section" style={{ padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/blogs"
            className="btn btn-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              color: "var(--wine, #8B1E3F)",
              textDecoration: "none",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: 6,
              background: "#FAF8F5",
            }}
          >
            ← Back to all stories
          </Link>
        </div>

        {/* Category Pill */}
        {blog.category && (
          <span
            style={{
              display: "inline-block",
              background: "#FFF0F5",
              color: "var(--pink-700, #b32a68)",
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.5px",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            {blog.category}
          </span>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            lineHeight: 1.25,
            color: "#1A1A1A",
            margin: "0 0 16px",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
          }}
        >
          {blog.title}
        </h1>

        {/* Meta Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#777",
            fontSize: 14,
            paddingBottom: 24,
            borderBottom: "1px solid #EAE0D7",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--wine, #8B1E3F)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              {(blog.author || "F")[0]}
            </span>
            <span style={{ fontWeight: 600, color: "#333" }}>{blog.author || "FlipsAura Team"}</span>
          </div>
          <span>•</span>
          <span>
            {blog.publishedAt
              ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Published"}
          </span>
        </div>

        {/* Cover Image */}
        {coverImg && (
          <div style={{ marginBottom: 36 }}>
            <img
              src={coverImg}
              alt={blog.title}
              style={{
                width: "100%",
                maxHeight: 520,
                objectFit: "cover",
                borderRadius: 16,
                boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
              }}
            />
          </div>
        )}

        {/* Excerpt if present */}
        {blog.excerpt && (
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "#555",
              fontStyle: "italic",
              borderLeft: "4px solid var(--wine, #8B1E3F)",
              paddingLeft: 20,
              margin: "0 0 32px",
            }}
          >
            {blog.excerpt}
          </div>
        )}

        {/* Rich Blog Content (Headings, Paragraphs, Images, Videos, Links) */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content || "" }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: "1px solid #EAE0D7",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>TAGS:</span>
            {blog.tags.map((t, idx) => (
              <span
                key={idx}
                style={{
                  background: "#FAF8F5",
                  color: "#555",
                  padding: "5px 12px",
                  borderRadius: 16,
                  fontSize: 13,
                  border: "1px solid #EAE0D7",
                }}
              >
                #{t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 48,
            padding: 32,
            background: "linear-gradient(135deg, #FFF0F5 0%, #FAF8F5 100%)",
            borderRadius: 16,
            textAlign: "center",
            border: "1px solid #F0E6DE",
          }}
        >
          <h3 style={{ margin: "0 0 8px", color: "var(--wine, #8B1E3F)", fontSize: 20 }}>
            Planning your dream wedding?
          </h3>
          <p style={{ margin: "0 0 20px", color: "#666", fontSize: 14 }}>
            Discover trusted venues, decorators, photographers, and makeup artists on FlipsAura.
          </p>
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              display: "inline-block",
              background: "var(--wine, #8B1E3F)",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Explore FlipsAura Marketplace
          </Link>
        </div>
      </div>
    </article>
  );
}
