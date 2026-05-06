import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadPdfToCloudinary(
  fileBuffer: Buffer,
  originalName: string,
  folder: string
) {
  ensureCloudinaryConfig();

  return await new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteCloudinaryAsset(publicId: string) {
  ensureCloudinaryConfig();
  return cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export default cloudinary;
