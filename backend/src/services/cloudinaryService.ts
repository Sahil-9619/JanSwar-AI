import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Initialize Cloudinary if credentials are provided
const useCloudinary = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name" &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== "your_cloudinary_api_key" &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== "your_cloudinary_api_secret";

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️ Cloudinary integration initialized successfully.");
} else {
  console.log("📁 Cloudinary credentials not configured. Using local disk uploads fallback.");
}

interface UploadResult {
  url: string;
  publicId?: string;
}

/**
 * Uploads a file to Cloudinary or falls back to local disk storage
 * @param filePath Absolute path of the file to upload
 * @param folder Cloudinary folder name (or local subdirectory)
 * @param resourceType Cloudinary resource type ('image', 'raw', 'video')
 */
export async function uploadFile(
  filePath: string,
  folder: string = "janswar_media",
  resourceType: "image" | "raw" | "video" = "raw"
): Promise<UploadResult> {
  if (useCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: resourceType,
      });
      // Delete temporary local file after uploading to Cloudinary
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload failed, falling back to local storage:", error);
      // Fall through to local storage if Cloudinary fails
    }
  }

  // Local storage fallback
  const fileName = path.basename(filePath);
  const targetDir = path.join(__dirname, "../..", "uploads", folder);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, fileName);
  fs.renameSync(filePath, targetPath);

  // Return local URL served statically by express (e.g. /uploads/folder/filename)
  const relativeUrl = `/uploads/${folder}/${fileName}`;
  return {
    url: relativeUrl,
    publicId: fileName, // Use file name as local identifier
  };
}
