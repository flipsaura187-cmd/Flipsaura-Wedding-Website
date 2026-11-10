import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/axios";

// ─── Cache TTL (5 minutes) ───────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildQueryKey(prefix, paramsObj = {}) {
  const keys = Object.keys(paramsObj).filter(
    (k) =>
      paramsObj[k] !== undefined &&
      paramsObj[k] !== null &&
      String(paramsObj[k]).trim() !== ""
  );
  keys.sort();
  const parts = keys.map((k) => `${k}=${encodeURIComponent(String(paramsObj[k]).trim())}`);
  return `${prefix}:${parts.join("&") || "default"}`;
}

function isFresh(timestamp) {
  return timestamp && Date.now() - timestamp < CACHE_TTL_MS;
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Fetch listings for ANY category (hotels, venues, photography, mehandi, etc.)
 * Skips fetch if data is still fresh in cache.
 */
export const fetchCategoryItems = createAsyncThunk(
  "listings/fetchCategoryItems",
  async ({ slug, params = {} }, { getState, rejectWithValue }) => {
    const queryKey = buildQueryKey(slug, params);
    const existing = getState().listings.categoriesCache[queryKey];

    if (isFresh(existing?.timestamp)) {
      return { queryKey, slug, data: existing, fromCache: true };
    }

    try {
      const urlParams = new URLSearchParams({ category: slug, limit: "12", ...params });
      const { data: res } = await api.get(`/api/items?${urlParams.toString()}`);

      if (!res?.ok) return rejectWithValue("Failed to fetch items");

      const payload = {
        items: res.data.items || [],
        total: res.data.total ?? res.data.items?.length ?? 0,
        totalPages: res.data.totalPages || 1,
        page: Number(params.page) || 1,
        warning: res.data.warning || "",
        timestamp: Date.now(),
      };

      return { queryKey, slug, data: payload, fromCache: false };
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

/**
 * Fetch filter options metadata for a category slug
 */
export const fetchFilterMeta = createAsyncThunk(
  "listings/fetchFilterMeta",
  async (slug, { getState, rejectWithValue }) => {
    const existing = getState().listings.filterMetaCache[slug];
    if (isFresh(existing?.timestamp)) {
      return { slug, meta: existing.meta, fromCache: true };
    }

    try {
      const { data: res } = await api.get(`/api/items/filter-options?category=${slug}`);
      if (!res?.ok) return rejectWithValue("Failed to fetch filter meta");
      return { slug, meta: res.data, timestamp: Date.now(), fromCache: false };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch a single item/hotel/venue detail by ID or slug
 */
export const fetchItemDetail = createAsyncThunk(
  "listings/fetchItemDetail",
  async (idOrSlug, { getState, rejectWithValue }) => {
    const key = String(idOrSlug);
    const existing = getState().listings.itemDetailsCache[key];

    if (isFresh(existing?.timestamp)) {
      return { key, item: existing.item, fromCache: true };
    }

    try {
      const { data: res } = await api.get(`/api/items/${key}`);
      if (!res?.ok || !res.data?.item) return rejectWithValue("Item not found");
      return {
        key,
        item: res.data.item,
        timestamp: Date.now(),
        fromCache: false,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const listingsSlice = createSlice({
  name: "listings",
  initialState: {
    // { [queryKey]: { items, total, totalPages, page, warning, timestamp } }
    categoriesCache: {},

    // { [slug]: { meta, timestamp } }
    filterMetaCache: {},

    // { [idOrSlug]: { item, timestamp } }
    itemDetailsCache: {},

    // { [queryKey]: "idle" | "loading" | "succeeded" | "failed" }
    loadingStates: {},

    // { [queryKey]: errorMessage }
    errors: {},
  },
  reducers: {
    /**
     * Pre-fill item details cache when a list is loaded
     * (so card clicks open instantly at 0ms)
     */
    prefillItemDetails(state, action) {
      const items = action.payload;
      if (!Array.isArray(items)) return;
      const now = Date.now();
      for (const item of items) {
        if (!item) continue;
        const entry = { item, timestamp: now };
        if (item._id) state.itemDetailsCache[String(item._id)] = entry;
        if (item.slug) state.itemDetailsCache[String(item.slug)] = entry;
      }
    },

    /** Invalidate hotels cache */
    invalidateHotels(state) {
      const keysToDelete = Object.keys(state.categoriesCache).filter((k) =>
        k.startsWith("hotels:")
      );
      for (const k of keysToDelete) delete state.categoriesCache[k];
    },

    /** Invalidate venues cache */
    invalidateVenues(state) {
      const keysToDelete = Object.keys(state.categoriesCache).filter((k) =>
        k.startsWith("venues:")
      );
      for (const k of keysToDelete) delete state.categoriesCache[k];
    },

    /** Invalidate a specific item */
    invalidateItem(state, action) {
      const key = String(action.payload || "");
      if (key) delete state.itemDetailsCache[key];
    },

    /** Full cache reset */
    invalidateAll(state) {
      state.categoriesCache = {};
      state.filterMetaCache = {};
      state.itemDetailsCache = {};
      state.loadingStates = {};
      state.errors = {};
    },
  },
  extraReducers: (builder) => {
    // ── fetchCategoryItems ─────────────────────────────────────────────────
    builder
      .addCase(fetchCategoryItems.pending, (state, action) => {
        const { slug, params = {} } = action.meta.arg;
        const queryKey = buildQueryKey(slug, params);
        state.loadingStates[queryKey] = "loading";
        delete state.errors[queryKey];
      })
      .addCase(fetchCategoryItems.fulfilled, (state, action) => {
        const { queryKey, data } = action.payload;
        state.categoriesCache[queryKey] = data;
        state.loadingStates[queryKey] = "succeeded";

        // Pre-fill item details from list
        const now = Date.now();
        for (const item of data.items || []) {
          if (!item) continue;
          const entry = { item, timestamp: now };
          if (item._id) state.itemDetailsCache[String(item._id)] = entry;
          if (item.slug) state.itemDetailsCache[String(item.slug)] = entry;
        }
      })
      .addCase(fetchCategoryItems.rejected, (state, action) => {
        const { slug, params = {} } = action.meta.arg;
        const queryKey = buildQueryKey(slug, params);
        state.loadingStates[queryKey] = "failed";
        state.errors[queryKey] = action.payload;
      });

    // ── fetchFilterMeta ────────────────────────────────────────────────────
    builder
      .addCase(fetchFilterMeta.pending, (state, action) => {
        state.loadingStates[`filter:${action.meta.arg}`] = "loading";
      })
      .addCase(fetchFilterMeta.fulfilled, (state, action) => {
        const { slug, meta, timestamp } = action.payload;
        state.filterMetaCache[slug] = { meta, timestamp: timestamp || Date.now() };
        state.loadingStates[`filter:${slug}`] = "succeeded";
      })
      .addCase(fetchFilterMeta.rejected, (state, action) => {
        state.loadingStates[`filter:${action.meta.arg}`] = "failed";
      });

    // ── fetchItemDetail ────────────────────────────────────────────────────
    builder
      .addCase(fetchItemDetail.pending, (state, action) => {
        state.loadingStates[`item:${action.meta.arg}`] = "loading";
      })
      .addCase(fetchItemDetail.fulfilled, (state, action) => {
        const { key, item, timestamp } = action.payload;
        const entry = { item, timestamp: timestamp || Date.now() };
        state.itemDetailsCache[key] = entry;
        if (item._id) state.itemDetailsCache[String(item._id)] = entry;
        if (item.slug) state.itemDetailsCache[String(item.slug)] = entry;
        state.loadingStates[`item:${key}`] = "succeeded";
      })
      .addCase(fetchItemDetail.rejected, (state, action) => {
        state.loadingStates[`item:${action.meta.arg}`] = "failed";
      });
  },
});

export const {
  prefillItemDetails,
  invalidateHotels,
  invalidateVenues,
  invalidateItem,
  invalidateAll,
} = listingsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

function buildKey(slug, params) {
  return buildQueryKey(slug, params);
}

export const selectCategoryItems = (slug, params) => (state) => {
  const key = buildKey(slug, params);
  return state.listings.categoriesCache[key] || null;
};

export const selectCategoryLoading = (slug, params) => (state) => {
  const key = buildKey(slug, params);
  return state.listings.loadingStates[key] === "loading";
};

export const selectFilterMeta = (slug) => (state) => {
  return state.listings.filterMetaCache[slug]?.meta || null;
};

export const selectItemDetail = (idOrSlug) => (state) => {
  if (!idOrSlug) return null;
  return state.listings.itemDetailsCache[String(idOrSlug)]?.item || null;
};

export const selectItemDetailLoading = (idOrSlug) => (state) => {
  return state.listings.loadingStates[`item:${idOrSlug}`] === "loading";
};

export default listingsSlice.reducer;

