import { uploadToS3, uploadLocal } from "../services/upload.services.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const s3Configured =
      (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY) &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.AWS_S3_BUCKET;

    let imageUrl;
    if (s3Configured) imageUrl = await uploadToS3(req.file);
    
    else{
      console.warn("AWS Failed");
      imageUrl = await uploadLocal(req.file);
    }
    res.status(200).json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

