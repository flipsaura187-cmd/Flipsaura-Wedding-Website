"use client";
import { useEffect, useState } from "react";
import Link from "@/compat/Link";
import api from "@/api/axios";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/events?status=PUBLISHED");
        if (res.data?.ok && Array.isArray(res.data.data?.events)) {
          if (isMounted) setEvents(res.data.data.events);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const eventTypes = ["ALL", ...new Set(events.map((e) => e.type).filter(Boolean))];

  const filteredEvents =
    filter === "ALL"
      ? events
      : events.filter((e) => e.type?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="min-h-[85vh] bg-[#faf7f9] pb-16">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2a1726] via-[#4a1936] to-[#8B1E3F] text-white py-16 px-4 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative">
          <span className="inline-block bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
            🏆 Premier Experience
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            FlipsAura Events & Competitions
          </h1>
          <p className="text-white/85 text-base sm:text-lg leading-relaxed">
            Discover prestigious championships, student cups, exhibitions, and workshops.
            Compete with the best, test your skills, and conquer the grand stage.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      {eventTypes.length > 2 && (
        <div className="max-w-container mx-auto px-4 mt-8 mb-4">
          <div className="flex gap-2 flex-wrap justify-center">
            {eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filter === t
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/25"
                    : "bg-white text-ink border border-brand-200 hover:bg-brand-50"
                }`}
              >
                {t === "ALL" ? "All Events" : t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="max-w-container mx-auto px-4 mt-8">
        {loading ? (
          <div className="py-20 text-center text-brand-600 font-semibold animate-pulse">
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-brand-100 max-w-lg mx-auto shadow-sm">
            <div className="text-5xl mb-3">📅</div>
            <h3 className="font-serif text-xl font-bold text-ink mb-2">No active events right now</h3>
            <p className="text-muted text-sm mb-6">
              New competitions and events are announced regularly. Check back soon!
            </p>
            <Link
              href="/"
              to="/"
              className="inline-block px-6 py-2.5 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-ink font-semibold text-sm transition-colors"
            >
              Explore FlipsAura
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((ev) => {
              const formattedDate = ev.date
                ? new Date(ev.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              const totalPrizeAmount = Array.isArray(ev.prizes)
                ? ev.prizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                : 0;

              return (
                <div
                  key={ev._id}
                  className="group bg-white rounded-2xl overflow-hidden border border-brand-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Banner Image */}
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#2a1726] to-[#4a1936] overflow-hidden">
                    <img
                      src={
                        ev.bannerImage ||
                        "/images/categories/venues.jpg"
                      }
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {ev.type && (
                        <span className="bg-ink/80 backdrop-blur-sm text-gold font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                          {ev.type}
                        </span>
                      )}
                      {ev.featured && (
                        <span className="bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-ink font-bold text-xs px-3 py-1 rounded-full shadow">
                      {ev.registrationFee > 0
                        ? `₹${Number(ev.registrationFee).toLocaleString("en-IN")}`
                        : "Free"}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs text-brand-600 font-semibold mb-1.5">
                      Organized by {ev.organizer || "FlipsAura"}
                    </div>
                    <h3 className="font-serif font-bold text-lg text-ink mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-muted text-xs leading-relaxed mb-4 line-clamp-2">
                      {ev.shortDescription || ev.description}
                    </p>

                    {/* Metadata strip */}
                    <div className="bg-brand-50/70 p-3.5 rounded-xl text-xs space-y-1.5 mb-5 border border-brand-100/60">
                      <div className="flex justify-between">
                        <span className="text-muted">📍 Venue:</span>
                        <span className="font-semibold text-ink">
                          {ev.city ? `${ev.city}${ev.venue ? ` • ${ev.venue}` : ""}` : ev.venue || "TBA"}
                        </span>
                      </div>
                      {formattedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted">📅 Date:</span>
                          <span className="font-semibold text-ink">{formattedDate}</span>
                        </div>
                      )}
                      {totalPrizeAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted">🎁 Prizes:</span>
                          <span className="font-bold text-brand-700">
                            Up to ₹{totalPrizeAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto flex gap-2.5">
                      <Link
                        href={`/events/${ev.slug}`}
                        to={`/events/${ev.slug}`}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 text-ink text-center text-xs font-semibold transition-colors"
                      >
                        View Event
                      </Link>

                      {ev.isRegistrationOpen !== false && ev.status === "PUBLISHED" ? (
                        <Link
                          href={`/events/${ev.slug}/register`}
                          to={`/events/${ev.slug}/register`}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-center text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
                        >
                          Register Now
                        </Link>
                      ) : (
                        <span className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-center text-xs font-semibold flex items-center justify-center">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

