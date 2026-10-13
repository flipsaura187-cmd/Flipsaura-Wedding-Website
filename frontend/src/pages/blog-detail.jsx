"use client";
import { useEffect, useState } from "react";
import { useParams } from "@/compat/navigation";
import Link from "@/compat/Link";

import api from "@/api/axios";
export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");

    api.get(`/api/blogs/${slug}`)
      .then(({ data: j }) => {
        if (!j.ok) throw new Error(j.error || "Article not found");
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
      <section className="py-20 text-center min-h-[60vh] flex items-center justify-center">
        <p className="text-brand-600 font-semibold animate-pulse text-base">Loading wedding story…</p>
      </section>
    );
  }

  if (error || !blog) {
    return (
      <section className="py-20 min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-brand-50/50 p-8 rounded-2xl border border-brand-100">
          <span className="text-4xl">📖</span>
          <h1 className="font-serif text-2xl font-bold text-wine mt-3 mb-2">
            Story Not Found
          </h1>
          <p className="text-muted text-sm mb-6">
            This article might have been moved, unpublished, or the link may be outdated.
          </p>
          <Link
            href="/blogs"
            className="inline-block bg-wine hover:bg-brand-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-wine/20 transition-all"
          >
            ← Explore Other Wedding Stories
          </Link>
        </div>
      </section>
    );
  }

  const coverImg = blog.coverImage || blog.featuredImage;

  return (
    <article className="py-12 md:py-16 bg-white min-h-[75vh]">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-wine hover:text-brand-600 bg-brand-50 px-3.5 py-1.5 rounded-xl border border-brand-100 transition-colors"
          >
            ← Back to all stories
          </Link>
        </div>

        {/* Category Pill */}
        {blog.category && (
          <span className="inline-block bg-brand-50 text-brand-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-brand-100">
            {blog.category}
          </span>
        )}

        {/* Title */}
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-ink leading-tight mb-4">
          {blog.title}
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-muted text-xs md:text-sm pb-6 border-b border-brand-100 mb-8 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-wine text-white inline-flex items-center justify-center font-bold text-xs">
              {(blog.author || "F")[0]}
            </span>
            <span className="font-semibold text-ink">{blog.author || "FlipsAura Team"}</span>
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
          <div className="mb-8 rounded-2xl overflow-hidden shadow-md border border-brand-100">
            <img
              src={coverImg}
              alt={blog.title}
              className="w-full max-h-[520px] object-cover"
            />
          </div>
        )}

        {/* Excerpt if present */}
        {blog.excerpt && (
          <div className="text-base md:text-lg italic text-muted border-l-4 border-wine pl-5 mb-8 leading-relaxed">
            {blog.excerpt}
          </div>
        )}

        {/* Rich Blog Content */}
        <div
          className="blog-content leading-relaxed text-ink space-y-4"
          dangerouslySetInnerHTML={{ __html: blog.content || "" }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-brand-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase text-muted tracking-wider">TAGS:</span>
            {blog.tags.map((t, idx) => (
              <span
                key={idx}
                className="bg-brand-50 text-muted px-3 py-1 rounded-full text-xs border border-brand-100"
              >
                #{t.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 p-8 bg-gradient-to-br from-brand-50 to-brand-100/40 rounded-2xl text-center border border-brand-100 space-y-3">
          <h3 className="font-serif text-xl font-bold text-wine">
            Planning your dream wedding?
          </h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            Discover trusted venues, decorators, photographers, and makeup artists on FlipsAura.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-brand-500/20 transition-all"
            >
              Explore FlipsAura Marketplace
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

