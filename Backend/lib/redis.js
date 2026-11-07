import Redis from "ioredis";

/**
 * Shared Redis Client and Dual-Tier Cache for FlipsAura.
 * Connects via process.env.REDIS_URL.
 *
 * Reliability Guarantees:
 * 1. Single reusable singleton client across the backend lifecycle.
 * 2. enableOfflineQueue: false ensures requests never stall or hang if Redis is offline.
 * 3. In-memory L1 cache (MemoryCache) fallback ensures that all caching operations
 *    succeed at 0ms latency even when Redis is offline or running in local dev.
 * 4. Safe degradations across all cache calls without unhandled rejections.
 */

let redisClient = null;
let isConnected = false;
let hasLoggedOfflineWarning = false;

// In-Memory L1 Cache with TTL and LRU expiration
class MemoryCache {
  constructor(maxSize = 2000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.val;
  }

  set(key, val, ttlSeconds = 300) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    const expiry = Date.now() + Math.max(1, ttlSeconds) * 1000;
    this.cache.set(key, { val, expiry });
  }

  del(...keys) {
    let count = 0;
    for (const k of keys) {
      if (this.cache.delete(k)) count++;
    }
    return count;
  }

  delByPrefix(prefix) {
    let count = 0;
    for (const k of this.cache.keys()) {
      if (k.startsWith(prefix)) {
        this.cache.delete(k);
        count++;
      }
    }
    return count;
  }

  clear() {
    this.cache.clear();
  }
}

const localCache = new MemoryCache(3000);

export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    if (!hasLoggedOfflineWarning) {
      console.warn("[Redis] REDIS_URL not configured. Operating in high-performance in-memory cache mode.");
      hasLoggedOfflineWarning = true;
    }
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 5) return 15000;
        return Math.min(times * 1000, 10000);
      },
    });

    redisClient.on("connect", () => {
      isConnected = true;
      hasLoggedOfflineWarning = false;
      console.log("[Redis] Connected successfully to Redis server.");
    });

    redisClient.on("ready", () => {
      isConnected = true;
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      if (!hasLoggedOfflineWarning) {
        console.warn(`[Redis] Connection warning (${err.message}). In-memory L1 cache active.`);
        hasLoggedOfflineWarning = true;
      }
    });

    redisClient.on("close", () => {
      isConnected = false;
    });
  } catch (error) {
    console.warn("[Redis] Failed to initialize Redis client:", error.message);
    redisClient = null;
    isConnected = false;
  }

  return redisClient;
}

// Initialize on module load
getRedisClient();

export function isRedisReady() {
  return Boolean(redisClient && isConnected && redisClient.status === "ready");
}

/**
 * Deterministic hash/serialization of query parameters
 */
export function hashQuery(queryObj = {}) {
  const keys = Object.keys(queryObj).filter(
    (k) =>
      queryObj[k] !== undefined &&
      queryObj[k] !== null &&
      String(queryObj[k]).trim() !== ""
  );
  keys.sort();
  const sorted = keys
    .map((k) => `${k}=${String(queryObj[k]).trim()}`)
    .join("&");
  return sorted || "default";
}

/**
 * Safe GET wrapper
 */
export async function redisGet(key) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return null;
    return await client.get(key);
  } catch {
    return null;
  }
}

/**
 * Safe GET JSON wrapper
 */
export async function redisGetJSON(key) {
  try {
    const val = await redisGet(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/**
 * Safe SET with TTL wrapper (in seconds)
 */
export async function redisSet(key, value, ttlSeconds = 300) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return false;
    if (ttlSeconds > 0) {
      await client.set(key, String(value), "EX", ttlSeconds);
    } else {
      await client.set(key, String(value));
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe SET JSON with TTL wrapper
 */
export async function redisSetJSON(key, value, ttlSeconds = 300) {
  try {
    const stringified = JSON.stringify(value);
    return await redisSet(key, stringified, ttlSeconds);
  } catch {
    return false;
  }
}

/**
 * Safe DEL wrapper
 */
export async function redisDel(...keys) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected || keys.length === 0) return 0;
    const validKeys = keys.filter(Boolean);
    if (validKeys.length === 0) return 0;
    return await client.del(...validKeys);
  } catch {
    return 0;
  }
}

/**
 * Unified Cache GET (Tries Redis -> falls back to MemoryCache)
 */
export async function cacheGetJSON(key) {
  if (isRedisReady()) {
    try {
      const data = await redisGetJSON(key);
      if (data !== null && data !== undefined) return data;
    } catch {
      // Fall through to memory cache
    }
  }
  return localCache.get(key);
}

/**
 * Unified Cache SET (Sets in MemoryCache and Redis)
 */
export async function cacheSetJSON(key, value, ttlSeconds = 300) {
  localCache.set(key, value, ttlSeconds);
  if (isRedisReady()) {
    try {
      await redisSetJSON(key, value, ttlSeconds);
    } catch {
      // Degrade gracefully
    }
  }
  return true;
}

/**
 * Unified Cache DEL
 */
export async function cacheDel(...keys) {
  localCache.del(...keys);
  if (isRedisReady()) {
    try {
      await redisDel(...keys);
    } catch {
      // Degrade gracefully
    }
  }
  return true;
}

/**
 * Unified Cache DEL by Prefix
 */
export async function cacheDelByPrefix(prefix) {
  localCache.delByPrefix(prefix);
  if (isRedisReady()) {
    try {
      const client = getRedisClient();
      if (client) {
        const stream = client.scanStream({ match: `${prefix}*`, count: 100 });
        stream.on("data", async (resultKeys) => {
          if (Array.isArray(resultKeys) && resultKeys.length > 0) {
            await client.del(...resultKeys);
          }
        });
      }
    } catch {
      // Degrade gracefully
    }
  }
  return true;
}

/**
 * Safe atomic lock SET NX EX wrapper
 */
export async function redisAcquireLock(key, ttlSeconds = 15) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return true; // If Redis is down, allow request to proceed via DB
    const res = await client.set(key, "locked", "EX", ttlSeconds, "NX");
    return res === "OK";
  } catch {
    return true; // Fallback to proceed if Redis fails
  }
}

/**
 * Safe release lock wrapper
 */
export async function redisReleaseLock(key) {
  try {
    return await redisDel(key);
  } catch {
    return 0;
  }
}

/**
 * Increment a counter and set TTL if new key
 */
export async function redisIncrWithTTL(key, ttlSeconds = 900) {
  try {
    const client = getRedisClient();
    if (!client || !isConnected) return 1;
    const count = await client.incr(key);
    if (count === 1 && ttlSeconds > 0) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  } catch {
    return 1;
  }
}

/**
 * Helper to invalidate all auth-related cache keys for a user
 */
export async function invalidateUserAuthCache(email, userId = null) {
  const keys = [];
  if (email) {
    const normalized = email.trim().toLowerCase();
    keys.push(`auth:user:meta:${normalized}`);
    keys.push(`auth:user:notfound:${normalized}`);
    keys.push(`auth:signup:otp:${normalized}`);
    keys.push(`auth:signup:otp:cooldown:${normalized}`);
    keys.push(`auth:signup:lock:${normalized}`);
    keys.push(`auth:login:attempts:${normalized}`);
  }
  if (userId) {
    keys.push(`auth:session:${String(userId)}`);
  }
  localCache.del(...keys);
  return await redisDel(...keys);
}

/**
 * Domain-specific Invalidation Helpers
 */
export async function invalidateItemCache(itemId = null) {
  await cacheDelByPrefix("items:");
  await cacheDelByPrefix("item:");
  await cacheDelByPrefix("filter-options:");
  if (itemId) {
    await cacheDel(`item:${String(itemId)}`);
  }
}

export async function invalidateHotelCache(hotelId = null) {
  await cacheDelByPrefix("hotels:");
  await cacheDelByPrefix("hotel:");
  await cacheDelByPrefix("admin:hotels:");
  await invalidateItemCache(hotelId);
  if (hotelId) {
    await cacheDel(`hotel:${String(hotelId)}`, `admin:hotel:${String(hotelId)}`);
  }
}

export async function invalidateVenueCache(venueId = null) {
  await cacheDelByPrefix("venues:");
  await cacheDelByPrefix("venue:");
  await cacheDelByPrefix("admin:venues:");
  await invalidateItemCache(venueId);
  if (venueId) {
    await cacheDel(`venue:${String(venueId)}`, `admin:venue:${String(venueId)}`);
  }
}

export async function invalidateCategoryCache(slug = null) {
  await cacheDelByPrefix("categories:");
  await cacheDelByPrefix("category:");
  await cacheDelByPrefix("filter-options:");
  if (slug) {
    await cacheDel(`category:${String(slug).toLowerCase()}`);
  }
}

export async function invalidateRoomCache(roomId = null, hotelId = null) {
  await cacheDelByPrefix("rooms:");
  await cacheDelByPrefix("room:");
  if (hotelId) {
    await cacheDel(`rooms:hotel:${String(hotelId)}`);
    await invalidateHotelCache(hotelId);
  }
  if (roomId) {
    await cacheDel(`room:${String(roomId)}`);
  }
}

export async function invalidateBlogCache(slugOrId = null) {
  await cacheDelByPrefix("blogs:");
  if (slugOrId) {
    await cacheDel(`blog:${String(slugOrId).toLowerCase()}`);
  }
}

export async function invalidateEventCache(slug = null, id = null) {
  await cacheDelByPrefix("events:");
  if (slug) {
    await cacheDel(`event:${String(slug).toLowerCase()}`);
  }
  if (id) {
    await cacheDel(`event:${String(id)}`);
  }
}

export default {
  getRedisClient,
  isRedisReady,
  redisGet,
  redisGetJSON,
  redisSet,
  redisSetJSON,
  redisDel,
  cacheGetJSON,
  cacheSetJSON,
  cacheDel,
  cacheDelByPrefix,
  hashQuery,
  redisAcquireLock,
  redisReleaseLock,
  redisIncrWithTTL,
  invalidateUserAuthCache,
  invalidateItemCache,
  invalidateHotelCache,
  invalidateVenueCache,
  invalidateCategoryCache,
  invalidateRoomCache,
  invalidateBlogCache,
  invalidateEventCache,
};
