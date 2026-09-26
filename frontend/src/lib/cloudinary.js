import crypto from "crypto";

/**
 * Cloudinary signed-upload helper.
 *
 * Returns the parameters the browser needs to POST the file directly to
 * Cloudinary's `/auto/upload` endpoint. No file bytes pass through our server.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (same value, exposed to client)
 */
export function createUploadSignature({ folder = "flipsaura/items", publicId } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  if (publicId) params.public_id = publicId;

  // Cloudinary signature: sort params alphabetically, join as k=v&k=v, append secret, sha1.
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    publicId: publicId || null,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

/**
 * Build a delivery URL with optional transformations (e.g. "w_800,q_auto,f_auto").
 */
export function cldUrl(publicId, transformations = "f_auto,q_auto") {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!publicId || !cloudName) return "";
  if (publicId.startsWith("http")) return publicId; // already a full URL
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}
