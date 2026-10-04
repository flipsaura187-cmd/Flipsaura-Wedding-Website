import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import ItemCard from "@/components/ItemCard";
import HeroSlideshow from "@/components/Hero";
import EventNotificationBanner from "@/components/EventNotificationBanner";
import api from "@/api/axios";

const indianWeddingImages = [
  {
    url: "https://images.unsplash.com/photo-1611106211090-8f3c79eb8552?q=80&w=687&auto=format&fit=crop",
    alt: "Indian bride in red lehenga",
  },
  {
    url: "https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?q=80&w=1174&auto=format&fit=crop",
    alt: "Indian groom and baraat",
  },
  {
    url: "https://images.unsplash.com/photo-1635919254233-38ea27301900?q=80&w=1170&auto=format&fit=crop",
    alt: "Mehndi ceremony",
  },
  {
    url: "https://images.unsplash.com/photo-1735052712489-f45220126a0c?q=80&w=680&auto=format&fit=crop",
    alt: "Decorated mandap",
  },
  {
    url: "https://images.unsplash.com/photo-1587271339318-2e78fdf79586?q=80&w=1169&auto=format&fit=crop",
    alt: "Wedding ceremony",
  },
  {
    url: "https://images.unsplash.com/photo-1601121141503-c4796ffc4b52?q=80&w=1170&auto=format&fit=crop",
    alt: "Indian wedding food",
  },
];

const reviews = [
  [
    "Aisha & Rahul",
    "FlipsAura made venue booking a breeze. Stunning decor, smooth process.",
  ],
  [
    "Priya & Karan",
    "The planners we booked were absolute magic. Worth every rupee.",
  ],
  [
    "Neha & Aman",
    "From mandap to lighting — everything was just perfect.",
  ],
];

const defaultCategories = [
  {
    name: "Venues",
    slug: "venues",
    image: "/images/categories/venues.jpg",
  },
  {
    name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
    slug: "home-setup-pandal-tent-dj",
    image: "/images/categories/home-setup.jpg",
  },
  {
    name: "Planning & Decor",
    slug: "planning-decor",
    image: "/images/categories/planning-decor.jpg",
  },
  {
    name: "Photographer & Videographer",
    slug: "photographer-videographer",
    image: "/images/categories/photography.jpg",
  },
  {
    name: "Makeup & Grooming",
    slug: "makeup-grooming",
    image: "/images/categories/makeup-grooming.jpg",
  },
  {
    name: "Mehndi Services",
    slug: "mehndi-services",
    image: "/images/categories/mehndi.jpg",
  },
  {
    name: "Music & Dance",
    slug: "music-dance",
    image: "/images/categories/music-dance.jpg",
  },
  {
    name: "Pandit / Priest",
    slug: "pandit-priest",
    image: "/images/categories/pandit-priest.jpg",
  },
  {
    name: "Food / Catering",
    slug: "food-catering",
    image: "/images/categories/food-catering.jpg",
  },
  {
    name: "Invites & Gifts",
    slug: "invites-gifts",
    image: "/images/categories/invites-gifts.jpg",
  },
  {
    name: "Transport – Car / Bus / Auto",
    slug: "transport-car-bus-auto",
    image: "/images/categories/transport.jpg",
  },
  {
    name: "Virtual Planning",
    slug: "virtual-planning",
    image: "/images/categories/virtual-planning.jpg",
  },
  {
    name: "Hotels & Resorts",
    slug: "hotels-resorts",
    image: "/images/categories/hotels.jpg",
  },
  {
    name: "Orchestra & Live Band",
    slug: "orchestra-live-band",
    image: "/images/categories/orchestra.jpg",
  },
];

export default function HomePage() {
  const [data, setData] = useState({
    categories: defaultCategories,
    featured: [],
  });

  useEffect(() => {
    let isMounted = true;

    const fetchHomePageData = async () => {
      // Fetch categories & featured items concurrently in parallel
      await Promise.allSettled([
        api.get("/api/categories")
          .then((catRes) => {
            const fetchedCats = catRes.data?.data?.categories;
            if (isMounted && Array.isArray(fetchedCats) && fetchedCats.length > 0) {
              setData((prev) => ({ ...prev, categories: fetchedCats }));
            }
          })
          .catch((error) => {
            console.warn("Failed to load categories from API, using fallback:", error);
          }),
        api.get("/api/items?limit=8&sort=newest")
          .then((itemsRes) => {
            const fetchedItems = itemsRes.data?.data?.items;
            if (isMounted && Array.isArray(fetchedItems)) {
              setData((prev) => ({ ...prev, featured: fetchedItems }));
            }
          })
          .catch((error) => {
            console.warn("Failed to load featured items:", error);
          }),
      ]);
    };

    fetchHomePageData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesToRender =
    data.categories && data.categories.length > 0
      ? data.categories
      : defaultCategories;

  return (
    <>
      {/* Event Notification Banner */}
      <EventNotificationBanner />

      {/* Hero Section */}
      <HeroSlideshow />

      {/* Categories Section */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Shop by category</h2>
          </div>

          <div className="grid grid-4">
            {categoriesToRender.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                to={`/categories/${category.slug}`}
                className="cat-card"
              >
                <div className="cat-card-bg">
                  <img
                    src={
                      category.image ||
                      "/images/categories/home-setup.jpg"
                    }
                    alt={category.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/categories/home-setup.jpg";
                    }}
                  />

                  <div className="cat-card-overlay" />
                </div>

                <div className="cat-card-content">
                  <h3>{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Inspiration Section */}
      <section
        className="section"
        style={{ background: "var(--pink-50)" }}
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Inspiration</span>
              <h2>From real FlipsAura weddings</h2>
            </div>
          </div>

          <div className="gallery">
            {indianWeddingImages.map((image, index) => (
              <div className="gallery-item" key={index}>
                <img src={image.url} alt={image.alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Trending</span>
              <h2>Featured listings</h2>
            </div>
          </div>

          {data.featured.length > 0 ? (
            <div className="grid grid-4">
              {data.featured.map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              No listings yet — admins can add categories & items from{" "}
              <strong>/admin</strong>.
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section
        className="section"
        style={{ background: "var(--pink-50)" }}
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Loved by couples</span>
              <h2>Stories from our brides & grooms</h2>
            </div>
          </div>

          <div className="grid grid-3">
            {reviews.map(([name, text]) => (
              <div className="review" key={name}>
                <div className="stars">★★★★★</div>

                <p>"{text}"</p>

                <div className="review-author">
                  — {name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About FlipsAura Section */}
      <section id="about" className="section" style={{ background: "var(--surface, #fff)", borderTop: "1px solid var(--border, #eee)" }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="section-head" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="eyebrow">About FlipsAura</span>
            <h2>Your Trusted Partner For Seamless Event Planning</h2>
          </div>

          <div style={{ lineHeight: 1.8, fontSize: "1.05rem", color: "var(--foreground, #333)" }}>
            <p style={{ marginBottom: "1rem" }}>
              Welcome to <strong>FlipsAura</strong> — your trusted platform for seamless event and wedding planning solutions.
              Launched in <strong>May 2026</strong>, FlipsAura was created with a clear vision to simplify how couples and families plan their dream celebrations, uniting trusted venues, planners, caterers, and decorators onto one reliable platform.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Founded by <strong>Abhishek Kumar</strong>, FlipsAura is built with a strong entrepreneurial spirit to transform the event services industry, especially across <strong>North India</strong>. The idea behind FlipsAura is simple — to eliminate the stress of managing multiple vendors by providing a curated, verified one-stop solution.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
              <div style={{ padding: "1.5rem", background: "var(--pink-50, #FFF5F7)", borderRadius: "12px", border: "1px solid var(--pink-100, #FCE7EC)" }}>
                <h4 style={{ color: "var(--wine, #8B1E3F)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>🎯 Our Mission</h4>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#555" }}>
                  To make wedding and event planning transparent, effortless, and stress-free by connecting you with verified, trusted vendors under one roof.
                </p>
              </div>

              <div style={{ padding: "1.5rem", background: "var(--pink-50, #FFF5F7)", borderRadius: "12px", border: "1px solid var(--pink-100, #FCE7EC)" }}>
                <h4 style={{ color: "var(--wine, #8B1E3F)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>🌟 Why Choose FlipsAura</h4>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#555" }}>
                  Curated venues, verified vendors, upfront pricing, dedicated support, and end-to-end coordination for unforgettable celebrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
