"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";

import api from "@/api/axios";
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
    api.get(url)
      .then(({ data }) => {
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
    <section className="py-12 md:py-16 bg-white min-h-[75vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            FlipsAura Journal
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-wine mb-3">
            Wedding Stories & Inspiration
          </h1>
          <p className="text-muted text-sm md:text-base leading-relaxed">
            Expert planning tips, breathtaking decor trends, real wedding features, and vendor spotlights to make your big day unforgettable.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mb-10 space-y-4">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search wedding stories, trends, decor…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-5 py-3 rounded-full border border-brand-200 bg-brand-50/40 text-ink text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 justify-center flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  category === cat
                    ? "bg-wine text-white shadow-md shadow-wine/20"
                    : "bg-white text-muted border border-brand-200 hover:bg-brand-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-brand-600 font-semibold animate-pulse text-base">
            Loading inspiring stories…
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 px-6 bg-brand-50/50 rounded-2xl border border-brand-100 max-w-lg mx-auto">
            <span className="text-4xl">✨</span>
            <h3 className="font-serif text-xl font-bold text-wine mt-3 mb-2">No articles found</h3>
            <p className="text-muted text-sm mb-4">
              {search || category !== "All"
                ? "Try adjusting your search query or selecting a different category."
                : "New wedding inspiration articles will appear here once published."}
            </p>
            {(search || category !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setPage(1);
                }}
                className="px-4 py-2 rounded-xl border border-brand-200 bg-white text-xs font-bold text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => {
              const img = blog.coverImage || blog.featuredImage;

              return (
                <Link
                  href={`/blogs/${blog.slug}`}
                  key={blog._id}
                  className="group bg-white rounded-2xl overflow-hidden border border-brand-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-brand-50 overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-3xl text-wine">
                        💍
                      </div>
                    )}
                    {blog.category && (
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-wine text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {blog.category}
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs text-muted mb-2">
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently Published"}{" "}
                      • {blog.author || "FlipsAura"}
                    </div>

                    <h3 className="font-serif font-bold text-ink text-lg line-clamp-2 group-hover:text-wine transition-colors mb-2">
                      {blog.title}
                    </h3>

                    <p className="text-muted text-sm line-clamp-3 leading-relaxed flex-1 mb-4">
                      {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]+>/g, " ").slice(0, 110) + "..." : "")}
                    </p>

                    <div className="flex items-center text-xs font-bold text-wine group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <span className="ml-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <button
              disabled={page === 1}
              onClick={() => {
                setPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm font-semibold hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-muted px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 rounded-xl border border-brand-200 bg-white text-ink text-sm font-semibold hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

