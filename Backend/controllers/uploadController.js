import { createUploadSignature } from "../lib/cloudinary.js";

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
