import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import { useRouter } from "@/compat/navigation";
import { useAuth } from "@/context/AuthContext";
import ItemCard from "@/components/ItemCard";
import HeroSlideshow from "@/components/Hero";
import EventNotificationBanner from "@/components/EventNotificationBanner";
import HotelSearchBar from "@/components/HotelSearchBar";
import api from "@/api/axios";

const indianWeddingImages = [
  {
    url: "/images/categories/venues.jpg",
    alt: "Grand Wedding Venue",
  },
  {
    url: "/images/hero/slide-2.jpg",
    alt: "Indian groom and wedding celebrations",
  },
  {
    url: "/images/categories/mehndi.jpg",
    alt: "Traditional Mehndi ceremony",
  },
  {
    url: "/images/categories/planning-decor.jpg",
    alt: "Decorated mandap and stage",
  },
  {
    url: "/images/categories/photography.jpg",
    alt: "Cinematic wedding photography",
  },
  {
    url: "/images/categories/food-catering.jpg",
    alt: "Indian wedding food & catering feast",
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
    name: "Hotels",
    slug: "hotels",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792372004/flipsaura/categories/category_hotels_1792372002950.jpg",
  },
  {
    name: "Venue/Resorts",
    slug: "venues",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226355/flipsaura/categories/category_venues.png",
  },
  {
    name: "Home Setup – Pandal / Tent / DJ / Full Ghar Setup",
    slug: "home-setup-pandal-tent-dj",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226356/flipsaura/categories/category_home-setup-pandal-tent-dj.png",
  },
  {
    name: "Transport – Car / Bus / Auto",
    slug: "transport-car-bus-auto",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226365/flipsaura/categories/category_transport-car-bus-auto.png",
  },
  {
    name: "Pandit / Priest",
    slug: "pandit-priest",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226362/flipsaura/categories/category_pandit-priest.png",
  },
  {
    name: "Food / Catering",
    slug: "food-catering",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226363/flipsaura/categories/category_food-catering.png",
  },
  {
    name: "Photographer & Videographer",
    slug: "photographer-videographer",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226358/flipsaura/categories/category_photographer-videographer.png",
  },
  {
    name: "Makeup & Grooming",
    slug: "makeup-grooming",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226359/flipsaura/categories/category_makeup-grooming.png",
  },
  {
    name: "Mehndi Services",
    slug: "mehndi-services",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226360/flipsaura/categories/category_mehndi-services.png",
  },
  {
    name: "Music & Dance",
    slug: "music-dance",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226361/flipsaura/categories/category_music-dance.png",
  },
  {
    name: "Orchestra & Live Band",
    slug: "orchestra-live-band",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226368/flipsaura/categories/category_orchestra-live-band.png",
  },
  {
    name: "Virtual Planning",
    slug: "virtual-planning",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226366/flipsaura/categories/category_virtual-planning.jpg",
  },
  {
    name: "Planning & Decor",
    slug: "planning-decor",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226357/flipsaura/categories/category_planning-decor.png",
  },
  {
    name: "Invites & Gifts",
    slug: "invites-gifts",
    image: "https://res.cloudinary.com/dvvpsnea0/image/upload/v1792226364/flipsaura/categories/category_invites-gifts.jpg",
  },
];

function getCategoryImageUrl(image) {
  if (!image) return "/images/categories/home-setup.jpg";
  return image;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isVendor = !authLoading && user && String(user.role || "").toLowerCase() === "vendor";

  useEffect(() => {
    if (isVendor) {
      router.replace("/vendor/dashboard");
    }
  }, [isVendor, router]);

  const [data, setData] = useState({
    categories: defaultCategories,
    featured: [],
  });

  useEffect(() => {
    if (isVendor) return;
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

  const orderedSlugs = [
    "hotels",                     // 1. Hotel
    "venues",                     // 2. Venue
    "home-setup-pandal-tent-dj",  // 3. Home setup
    "transport-car-bus-auto",     // 4. Cars
    "pandit-priest",              // 5. Pandit ji ka photo
    "food-catering",              // 6. Food catering
    "photographer-videographer",  // Photography
    "makeup-grooming",            // Makeup
    "mehndi-services",            // Mehndi
    "music-dance",                // Music & Dance
    "orchestra-live-band",        // Orchestra
    "virtual-planning",           // Virtual Planning
    "planning-decor",             // Planning decor neeche
    "invites-gifts",              // Invite gift sbse neeche
  ];

  const rawCategories =
    data.categories && data.categories.length > 0
      ? data.categories
      : defaultCategories;

  const categoriesToRender = [...rawCategories].sort((a, b) => {
    const idxA = orderedSlugs.indexOf(a.slug);
    const idxB = orderedSlugs.indexOf(b.slug);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  if (isVendor) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 bg-surface">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-base font-medium">Opening Vendor Portal...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section with Event Notification Banner */}
      <div className="relative">
        <EventNotificationBanner />
        <HeroSlideshow />
      </div>

      {/* Hotel Search Widget */}
      <HotelSearchBar />

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-white w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              Curated Services
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              Shop by category
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
            {categoriesToRender.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                to={`/categories/${category.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 block border border-brand-100/60"
              >
                <div className="w-full h-full relative">
                  <img
                    src={getCategoryImageUrl(category.image)}
                    alt={category.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/categories/home-setup.jpg";
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-3.5 text-center">
                  <h3 className="text-white font-serif font-bold text-xs sm:text-sm line-clamp-2 group-hover:text-brand-200 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Inspiration Section */}
      <section className="py-16 bg-brand-50">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              Inspiration
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              From real FlipsAura weddings
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {indianWeddingImages.map((image, index) => (
              <div
                key={index}
                className="aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-16 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              Trending
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              Featured listings
            </h2>
          </div>

          {data.featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.featured.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-brand-50/50 rounded-2xl border border-brand-100 text-muted">
              No listings yet — admins can add categories & items from{" "}
              <Link href="/admin" className="font-bold text-brand-700 underline">
                /admin
              </Link>.
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-brand-50">
        <div className="max-w-container mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              Loved by couples
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              Stories from our brides & grooms
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(([name, text]) => (
              <div
                key={name}
                className="bg-white p-6 md:p-8 rounded-2xl border border-brand-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="text-amber-400 text-base tracking-widest mb-3">
                    ★★★★★
                  </div>
                  <p className="text-muted italic text-sm md:text-base leading-relaxed">
                    "{text}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-brand-50 font-serif font-bold text-ink text-sm">
                  — {name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About FlipsAura Section */}
      <section id="about" className="py-16 bg-white border-t border-brand-100">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1.5 block">
              About FlipsAura
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink">
              Your Trusted Partner For Seamless Event Planning
            </h2>
          </div>

          <div className="text-muted text-base leading-relaxed space-y-4">
            <p>
              Welcome to <strong className="text-ink">FlipsAura</strong> — your trusted platform for seamless event and wedding planning solutions.
              Launched in <strong className="text-ink">May 2026</strong>, FlipsAura was created with a clear vision to simplify how couples and families plan their dream celebrations, uniting trusted venues, planners, caterers, and decorators onto one reliable platform.
            </p>
            <p>
              Founded by <strong className="text-ink">Abhishek Kumar</strong>, FlipsAura is built with a strong entrepreneurial spirit to transform the event services industry, especially across <strong className="text-ink">North India</strong>. The idea behind FlipsAura is simple — to eliminate the stress of managing multiple vendors by providing a curated, verified one-stop solution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100">
                <h4 className="text-wine font-bold text-base mb-2 flex items-center gap-2">
                  <span>🎯</span> Our Mission
                </h4>
                <p className="text-sm text-muted m-0">
                  To make wedding and event planning transparent, effortless, and stress-free by connecting you with verified, trusted vendors under one roof.
                </p>
              </div>

              <div className="p-6 bg-brand-50 rounded-2xl border border-brand-100">
                <h4 className="text-wine font-bold text-base mb-2 flex items-center gap-2">
                  <span>🌟</span> Why Choose FlipsAura
                </h4>
                <p className="text-sm text-muted m-0">
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
