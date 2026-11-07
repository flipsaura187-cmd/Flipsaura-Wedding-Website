"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import api from "@/api/axios";

const ListingContext = createContext(null);

export function ListingProvider({ children }) {
  // Synchronous ref store to prevent re-render delays and allow instant synchronous component initialization
  const cacheRef = useRef({
    hotels: {},
    venues: {},
    categories: {},
    filterMeta: {},
    itemDetails: {},
  });

  // React state stores to trigger reactive updates when cache is populated
  const [hotelsCache, setHotelsCache] = useState({});
  const [venuesCache, setVenuesCache] = useState({});
  const [categoriesCache, setCategoriesCache] = useState({});
  const [filterMetaCache, setFilterMetaCache] = useState({});
  const [itemDetailsCache, setItemDetailsCache] = useState({});

  // In-flight request deduplication map to prevent redundant parallel network calls
  const inFlightRequests = useRef(new Map());

  // Cache Time-To-Live: 5 minutes (300,000 ms)
  const CACHE_TTL_MS = 5 * 60 * 1000;

  /**
   * Helper to normalize query parameters into a consistent deterministic cache key
   */
  const buildQueryKey = (prefix, paramsObj = {}) => {
    const keys = Object.keys(paramsObj).filter(
      (k) =>
        paramsObj[k] !== undefined &&
        paramsObj[k] !== null &&
        String(paramsObj[k]).trim() !== ""
    );

    keys.sort();

    const parts = keys.map((k) => {
      const val = paramsObj[k];
      const normalized = Array.isArray(val)
        ? val.slice().sort().join(",")
        : String(val).trim();
      return `${k}=${encodeURIComponent(normalized)}`;
    });

    return `${prefix}:${parts.join("&") || "default"}`;
  };

  /**
   * Pre-fill item details cache from list responses so card clicks open instantaneously (0ms)
   */
  const prefillItemDetails = useCallback((itemsList = []) => {
    if (!Array.isArray(itemsList) || itemsList.length === 0) return;
    const now = Date.now();

    for (const it of itemsList) {
      if (!it) continue;
      const entry = { item: it, timestamp: now };
      if (it._id) {
        cacheRef.current.itemDetails[String(it._id)] = entry;
      }
      if (it.slug) {
        cacheRef.current.itemDetails[String(it.slug)] = entry;
      }
    }

    setItemDetailsCache((prev) => {
      const next = { ...prev };
      for (const it of itemsList) {
        if (!it) continue;
        const entry = { item: it, timestamp: now };
        if (it._id) next[String(it._id)] = entry;
        if (it.slug) next[String(it.slug)] = entry;
      }
      return next;
    });
  }, []);

  /**
   * Synchronous cache retrieval for initial useState in components
   */
  const getHotelsFromState = useCallback((paramsObj = {}) => {
    const queryKey = buildQueryKey("hotels", paramsObj);
    const existing = cacheRef.current.hotels[queryKey];
    if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
      return existing;
    }
    return null;
  }, []);

  const getVenuesFromState = useCallback((paramsObj = {}) => {
    const queryKey = buildQueryKey("venues", paramsObj);
    const existing = cacheRef.current.venues[queryKey];
    if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
      return existing;
    }
    return null;
  }, []);

  const getCategoryFromState = useCallback((slug = "hotels", paramsObj = {}) => {
    const queryKey = buildQueryKey(`cat:${slug}`, paramsObj);
    const existing = cacheRef.current.categories[queryKey];
    if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
      return existing;
    }
    return null;
  }, []);

  const getItemDetailFromState = useCallback((idOrSlug) => {
    if (!idOrSlug) return null;
    const existing = cacheRef.current.itemDetails[String(idOrSlug)];
    if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
      return existing.item;
    }
    return null;
  }, []);

  const getFilterMetaFromState = useCallback((slug = "hotels") => {
    const existing = cacheRef.current.filterMeta[slug];
    if (existing && Date.now() - existing.timestamp < CACHE_TTL_MS) {
      return existing.meta;
    }
    return null;
  }, []);

  /**
   * Generic fetcher & cacher for any category items (hotels, photography, mehandi, etc.)
   */
  const getCachedCategoryItems = useCallback(
    async (slug = "hotels", paramsObj = {}, forceRefresh = false) => {
      const isHotels = slug === "hotels";
      const isVenues = slug === "venues";
      const prefix = isHotels ? "hotels" : isVenues ? "venues" : `cat:${slug}`;
      const queryKey = buildQueryKey(prefix, paramsObj);

      // Check synchronous cacheRef
      const targetStore = isHotels
        ? cacheRef.current.hotels
        : isVenues
        ? cacheRef.current.venues
        : cacheRef.current.categories;

      const existing = targetStore[queryKey];
      const isFresh = existing && Date.now() - existing.timestamp < CACHE_TTL_MS;

      // 1. Instant hit from state cache
      if (!forceRefresh && isFresh) {
        return { data: existing, fromState: true };
      }

      // 2. Request deduplication (prevent duplicate API calls for same filters)
      if (inFlightRequests.current.has(queryKey)) {
        const inFlight = await inFlightRequests.current.get(queryKey);
        return { data: inFlight, fromState: true };
      }

      const fetchPromise = (async () => {
        try {
          const params = new URLSearchParams({
            category: slug,
            limit: "12",
            ...paramsObj,
          });

          const { data: res } = await api.get(`/api/items?${params.toString()}`);
          if (res?.ok && res.data) {
            const payload = {
              items: res.data.items || [],
              total: res.data.total ?? res.data.items?.length ?? 0,
              totalPages: res.data.totalPages || 1,
              page: Number(paramsObj.page) || 1,
              warning: res.data.warning || "",
              timestamp: Date.now(),
            };

            // Update ref
            targetStore[queryKey] = payload;

            // Update state
            if (isHotels) {
              setHotelsCache((prev) => ({ ...prev, [queryKey]: payload }));
            } else if (isVenues) {
              setVenuesCache((prev) => ({ ...prev, [queryKey]: payload }));
            } else {
              setCategoriesCache((prev) => ({ ...prev, [queryKey]: payload }));
            }

            // Pre-fill item details for instant 0ms clicks
            prefillItemDetails(payload.items);
            return payload;
          }
          return existing || null;
        } catch (err) {
          console.error(`getCachedCategoryItems (${slug}) error:`, err);
          return existing || null;
        } finally {
          inFlightRequests.current.delete(queryKey);
        }
      })();

      inFlightRequests.current.set(queryKey, fetchPromise);
      const result = await fetchPromise;
      return { data: result, fromState: false };
    },
    [prefillItemDetails]
  );

  /**
   * Fetch or retrieve cached Hotels from state
   */
  const getCachedHotels = useCallback(
    async (paramsObj = {}, forceRefresh = false) => {
      return getCachedCategoryItems("hotels", paramsObj, forceRefresh);
    },
    [getCachedCategoryItems]
  );

  /**
   * Fetch or retrieve cached Venues from state
   */
  const getCachedVenues = useCallback(
    async (paramsObj = {}, forceRefresh = false) => {
      return getCachedCategoryItems("venues", paramsObj, forceRefresh);
    },
    [getCachedCategoryItems]
  );

  /**
   * Fetch or retrieve cached Filter Options metadata
   */
  const getCachedFilterMeta = useCallback(
    async (slug = "hotels", forceRefresh = false) => {
      const existing = cacheRef.current.filterMeta[slug];
      const isFresh = existing && Date.now() - existing.timestamp < CACHE_TTL_MS;

      if (!forceRefresh && isFresh) {
        return existing.meta;
      }

      const reqKey = `filter-meta:${slug}`;
      if (inFlightRequests.current.has(reqKey)) {
        return inFlightRequests.current.get(reqKey);
      }

      const fetchPromise = (async () => {
        try {
          const { data: res } = await api.get(`/api/items/filter-options?category=${slug}`);
          if (res?.ok && res.data) {
            const meta = res.data;
            const entry = { meta, timestamp: Date.now() };
            cacheRef.current.filterMeta[slug] = entry;
            setFilterMetaCache((prev) => ({ ...prev, [slug]: entry }));
            return meta;
          }
          return existing?.meta || null;
        } catch (err) {
          console.error(`getCachedFilterMeta (${slug}) error:`, err);
          return existing?.meta || null;
        } finally {
          inFlightRequests.current.delete(reqKey);
        }
      })();

      inFlightRequests.current.set(reqKey, fetchPromise);
      return fetchPromise;
    },
    []
  );

  /**
   * Fetch or retrieve individual Hotel, Venue or Item details (0ms instant click)
   */
  const getCachedItemDetail = useCallback(
    async (idOrSlug, forceRefresh = false) => {
      if (!idOrSlug) return null;
      const key = String(idOrSlug);
      const existing = cacheRef.current.itemDetails[key];
      const isFresh = existing && Date.now() - existing.timestamp < CACHE_TTL_MS;

      // If available in cache and fresh, return immediately!
      if (!forceRefresh && isFresh) {
        return { item: existing.item, fromState: true };
      }

      const reqKey = `detail:${key}`;
      if (inFlightRequests.current.has(reqKey)) {
        const inFlight = await inFlightRequests.current.get(reqKey);
        return { item: inFlight, fromState: true };
      }

      const fetchPromise = (async () => {
        try {
          const { data: res } = await api.get(`/api/items/${key}`);
          if (res?.ok && res.data?.item) {
            const item = res.data.item;
            const now = Date.now();
            const entry = { item, timestamp: now };

            cacheRef.current.itemDetails[key] = entry;
            if (item._id) cacheRef.current.itemDetails[String(item._id)] = entry;
            if (item.slug) cacheRef.current.itemDetails[String(item.slug)] = entry;

            setItemDetailsCache((prev) => ({
              ...prev,
              [key]: entry,
              ...(item._id ? { [String(item._id)]: entry } : {}),
              ...(item.slug ? { [String(item.slug)]: entry } : {}),
            }));
            return item;
          }
          return existing?.item || null;
        } catch (err) {
          console.error("getCachedItemDetail error:", err);
          return existing?.item || null;
        } finally {
          inFlightRequests.current.delete(reqKey);
        }
      })();

      inFlightRequests.current.set(reqKey, fetchPromise);
      const item = await fetchPromise;
      return { item, fromState: false };
    },
    []
  );

  /**
   * Clear state caches (used when a vendor/admin updates or adds listings)
   */
  const invalidateHotels = useCallback(() => {
    cacheRef.current.hotels = {};
    setHotelsCache({});
  }, []);

  const invalidateVenues = useCallback(() => {
    cacheRef.current.venues = {};
    setVenuesCache({});
  }, []);

  const invalidateItem = useCallback((idOrSlug) => {
    if (!idOrSlug) return;
    const key = String(idOrSlug);
    delete cacheRef.current.itemDetails[key];
    setItemDetailsCache((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const invalidateAll = useCallback(() => {
    cacheRef.current = {
      hotels: {},
      venues: {},
      categories: {},
      filterMeta: {},
      itemDetails: {},
    };
    setHotelsCache({});
    setVenuesCache({});
    setCategoriesCache({});
    setFilterMetaCache({});
    setItemDetailsCache({});
  }, []);

  return (
    <ListingContext.Provider
      value={{
        hotelsCache,
        venuesCache,
        categoriesCache,
        itemDetailsCache,
        getHotelsFromState,
        getVenuesFromState,
        getCategoryFromState,
        getItemDetailFromState,
        getFilterMetaFromState,
        getCachedHotels,
        getCachedVenues,
        getCachedCategoryItems,
        getCachedFilterMeta,
        getCachedItemDetail,
        prefillItemDetails,
        invalidateHotels,
        invalidateVenues,
        invalidateItem,
        invalidateAll,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingContext);
  if (!ctx) {
    throw new Error("useListings must be used within a ListingProvider");
  }
  return ctx;
}
