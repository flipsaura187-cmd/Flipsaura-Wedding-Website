import { createUploadSignature } from "../lib/cloudinary.js";
import crypto from "crypto";

export function createUpload(req, res) {
  try {
    const data = createUploadSignature({
      folder: req.body.folder || "flipsaura/items",
      publicId: req.body.publicId,
    });
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Failed to create upload signature" });
  }
}

/**
 * Direct file upload handler.
 * Accepts base64 dataUrl or binary buffer string, uploads directly to Cloudinary or falls back to data URI.
 */
export async function directUpload(req, res) {
  try {
    const { file, dataUrl, folder = "flipsaura/documents" } = req.body;
    const fileToUpload = file || dataUrl;

    if (!fileToUpload) {
      return res.status(400).json({ ok: false, error: "No file content provided" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const params = { folder, timestamp };
      const toSign = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&");
      const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

      const formData = new URLSearchParams();
      formData.append("file", fileToUpload);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const uploadResult = await response.json();
        return res.json({
          ok: true,
          data: {
            url: uploadResult.secure_url || uploadResult.url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
          },
        });
      }
    }

    // Fallback: If cloudinary not available or fails, use the provided data URI
    return res.json({
      ok: true,
      data: {
        url: fileToUpload,
      },
    });
  } catch (error) {
    console.error("directUpload error:", error);
    res.status(500).json({ ok: false, error: error.message || "Upload failed" });
  }
}
