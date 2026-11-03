import Redis from "ioredis";

/**
 * Shared Redis Client for FlipsAura Authentication.
 * Connects via process.env.REDIS_URL.
 *
 * Reliability Guarantees:
 * 1. Single reusable singleton client across the backend lifecycle.
 * 2. enableOfflineQueue: false ensures requests never stall or hang if Redis is offline.
 * 3. Every helper function catches Redis errors and degrades gracefully to null/false,
 *    allowing the MongoDB-based authentication flow to proceed uninterrupted.
 */

let redisClient = null;
let isConnected = false;
let hasLoggedOfflineWarning = false;

export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    if (!hasLoggedOfflineWarning) {
      console.warn("[Redis] REDIS_URL environment variable is not defined. Caching is disabled.");
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
        if (times > 10) return 10000;
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
        console.warn(`[Redis] Connection warning (${err.message}). Authentication will fall back to MongoDB gracefully.`);
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
 * Safe atomic lock SET NX EX wrapper
 * Returns true if the key was set (lock acquired), false if already exists or error.
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
  return await redisDel(...keys);
}

export default {
  getRedisClient,
  isRedisReady,
  redisGet,
  redisGetJSON,
  redisSet,
  redisSetJSON,
  redisDel,
  redisAcquireLock,
  redisReleaseLock,
  redisIncrWithTTL,
  invalidateUserAuthCache,
};

