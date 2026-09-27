"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "@/compat/navigation";

import api from "@/api/axios";
export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [user, setUser] = useState(null); // logged in user

  // Fetch item, reviews, and current user
  useEffect(() => {
    (async () => {
      try {
        const [itemRes, reviewRes, userRes] = await Promise.all([
          api.get(`/api/items/${id}`),
          api.get(`/api/reviews?itemId=${id}`),
          api.get("/api/auth/me") // adjust endpoint if needed
        ]);
        const itemData = itemRes.data;
        const reviewData = reviewRes.data;
        const userData = userRes.data;

        if (itemData.ok) setItem(itemData.data.item);
        if (reviewData.ok) setReviews(reviewData.data.reviews);
        if (userData.ok) setUser(userData.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBookingClick = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?next=${returnUrl}`);
    } else {
      router.push(`/checkout?itemId=${item?._id}`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (rating === 0) {
      setSubmitError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post("/api/reviews", { itemId: id, rating, comment });
      if (!data.ok) throw new Error(data.error || "Failed to submit");
      // Refresh reviews
      const { data: reviewData } = await api.get(`/api/reviews?itemId=${id}`);
      if (reviewData.ok) setReviews(reviewData.data.reviews);
      // Reset form
      setRating(0);
      setComment("");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><div className="skeleton-loader">Loading experience...</div></div>;
  if (!item) return <div className="container"><div className="empty-state">✨ No such gem found.</div></div>;

  return (
    <>
      <main className="product-page">
        <div className="container">
          {/* breadcrumb */}
          <nav className="breadcrumb-modern">
            <button onClick={() => router.push("/")}>Home</button>
            <span>›</span>
            <button onClick={() => router.push(`/?category=${item.category?.slug}`)}>{item.category?.name || "Listings"}</button>
            <span>›</span>
            <span className="current">{item.title}</span>
          </nav>

          <div className="product-grid">
            {/* Gallery */}
            <div className="gallery-section">
              <div className="main-image-card" onClick={() => setShowLightbox(true)}>
                {item.images?.[activeImage] ? (
                  <img src={item.images[activeImage]} alt={item.title} className="main-image" />
                ) : (
                  <div className="image-placeholder">📸 No image</div>
                )}
                <div className="image-overlay"><span className="expand-icon">🔍</span></div>
              </div>
              <div className="thumbnail-strip">
                {item.images?.map((src, i) => (
                  <div key={i} className={`thumbnail ${i === activeImage ? "active" : ""}`} onClick={() => setActiveImage(i)}>
                    <img src={src} alt={`view ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Info / Description */}
            <div className="info-section">
              <div className="title-row">
                <h1>{item.title}</h1>
                <div className="rating-pill">
                  <span className="star">★</span> {item.rating?.toFixed(1) || "New"}
                  <span className="count">({item.reviewsCount || 0})</span>
                </div>
              </div>
              <div className="location-badge">{item.city || "Pan India"}</div>
              <div className="price-tag">₹{item.price?.toLocaleString("en-IN")}</div>
              <p className="short-desc">{item.about}</p>
              <div className="vendor-chip">
                <span className="avatar">👤</span>
                <div>
                  <strong>{item.vendor?.businessName || "Trusted Partner"}</strong>
                  <span className="verified">✓ Verified vendor</span>
                </div>
              </div>
              <div className="description-block">
                <h3>About this service</h3>
                <p>{item.description}</p>
              </div>
              {item.specifications?.length > 0 && (
                <div className="specs-block">
                  <h3>Specifications</h3>
                  <dl className="specs-grid">
                    {item.specifications.map((s, i) => (
                      <div key={i} className="spec-item">
                        <dt>{s.key}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <div className="mobile-actions">
                <button className="btn-primary-modern" onClick={handleBookingClick}>
                  {user ? "Book Now →" : "Login to Book →"}
                </button>
                {item.contactPhone && <a className="btn-outline-modern" href={`tel:${item.contactPhone}`}>📞 Call Vendor</a>}
              </div>
            </div>

            {/* Sticky booking side */}
            <aside className="sticky-sidebar">
              <div className="booking-card-modern">
                <div className="card-price">
                  <span className="big-price">₹{item.price?.toLocaleString("en-IN")}</span>
                  <span className="caption">one‑time</span>
                </div>
                <button className="btn-primary-modern btn-block" onClick={handleBookingClick}>
                  {user ? "Confirm booking" : "Login to book"}
                </button>
                {item.contactPhone && (
                  <button className="btn-outline-modern btn-block" onClick={() => window.location.href = `tel:${item.contactPhone}`}>
                    📞 Contact vendor
                  </button>
                )}
                <div className="trust-badge">✅ Safe payments &nbsp;|&nbsp; 🔒 Secure booking</div>
              </div>
            </aside>
          </div>

          {/* Reviews Section (including form) */}
          <div className="reviews-modern">
            <h2>❤️ Real couples, real words</h2>

            {/* Review Form */}
            <div className="review-form-card">
              <h3>Share your experience</h3>
              {user ? (
                <form onSubmit={handleSubmitReview}>
                  <div className="star-rating">
                    <label>Your rating</label>
                    <div className="stars-input">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= rating ? "filled" : ""}`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label>Your review (optional)</label>
                    <textarea
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you like about this service?"
                    />
                  </div>
                  {submitError && <div className="error-msg">{submitError}</div>}
                  <button type="submit" className="btn-primary-modern" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="login-prompt">
                  <span>🔐 </span>
                  <button onClick={() => router.push("/login?next=" + encodeURIComponent(window.location.pathname))}>
                    Log in
                  </button> to write a review
                </div>
              )}
            </div>

            {/* Existing reviews */}
            {reviews.length === 0 ? (
              <div className="empty-reviews">
                <span>✨ Be the first to share your experience</span>
              </div>
            ) : (
              <div className="reviews-grid-modern">
                {reviews.map(r => (
                  <div key={r._id} className="review-card-modern">
                    <div className="review-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? "filled" : "empty"}>★</span>
                      ))}
                    </div>
                    <p className="review-quote">“{r.comment}”</p>
                    <div className="reviewer-info">
                      <span className="reviewer-icon">👰</span>
                      <span>{r.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox (unchanged) */}
      {showLightbox && (
        <div className="lightbox-modern" onClick={() => setShowLightbox(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={item.images[activeImage]} alt={item.title} />
            <button className="close-lightbox" onClick={() => setShowLightbox(false)}>✕</button>
            <div className="lightbox-nav">
              {activeImage > 0 && <button onClick={() => setActiveImage(prev => prev - 1)}>← Prev</button>}
              {activeImage < (item.images?.length || 1) - 1 && <button onClick={() => setActiveImage(prev => prev + 1)}>Next →</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
