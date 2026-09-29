import api from "@/api/axios";
import axios from "axios";

/**
 * Uploads a file (image or PDF document) to Cloudinary via signed upload,
 * with fallback to server-side direct upload endpoint.
 */
export async function uploadFile(file, folder = "flipsaura/documents") {
  if (!file) throw new Error("No file provided");

  // Read as Data URL
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // Attempt 1: Signed direct-to-Cloudinary upload
  try {
    const { data: sigData } = await api.post("/api/upload", { folder });
    if (sigData.ok && sigData.data) {
      const { signature, timestamp, apiKey, cloudName } = sigData.data;
      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("api_key", apiKey);
      cloudForm.append("timestamp", timestamp);
      cloudForm.append("signature", signature);
      cloudForm.append("folder", folder);

      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const resourceType = isPdf ? "auto" : "image";

      const { data: uploadData } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        cloudForm
      );

      if (uploadData.secure_url || uploadData.url) {
        return uploadData.secure_url || uploadData.url;
      }
    }
  } catch (signedErr) {
    console.warn("Signed upload failed, falling back to direct upload:", signedErr.message);
  }

  // Attempt 2: Server-side direct upload endpoint
  try {
    const { data: directData } = await api.post("/api/upload/direct", {
      dataUrl,
      folder,
    });
    if (directData.ok && directData.data?.url) {
      return directData.data.url;
    }
  } catch (directErr) {
    console.warn("Direct server upload failed, using local dataUrl:", directErr.message);
  }

  // Fallback: return dataUrl
  return dataUrl;
}
