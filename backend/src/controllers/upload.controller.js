import { 
  uploadToS3, 
  startMultipartUpload, 
  uploadPart, 
  completeMultipartUpload, 
  abortMultipartUpload 
} from "../services/upload.services.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No File Found" });
    const imageUrl = await uploadToS3(req.file);
    res.status(200).json({ imageUrl, originalName: req.file.originalname });
  } catch (error) {
    next(error);
  }
};

export const startMultipart = async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ message: "fileName and contentType are required" });
    }
    const result = await startMultipartUpload(fileName, contentType);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const uploadPartHandler = async (req, res, next) => {
  try {
    const { uploadId, key, partNumber } = req.body;
    if (!uploadId || !key || !partNumber) {
      return res.status(400).json({ message: "uploadId, key, and partNumber are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No chunk file found" });
    }
    const result = await uploadPart(uploadId, key, partNumber, req.file.buffer);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const completeMultipart = async (req, res, next) => {
  try {
    const { uploadId, key, parts } = req.body;
    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return res.status(400).json({ message: "uploadId, key, and parts array are required" });
    }
    const imageUrl = await completeMultipartUpload(uploadId, key, parts);
    res.status(200).json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

export const abortMultipart = async (req, res, next) => {
  try {
    const uploadId = req.body.uploadId || req.query.uploadId;
    const key = req.body.key || req.query.key;

    if (!uploadId || !key) {
      return res.status(400).json({ message: "uploadId and key are required" });
    }
    await abortMultipartUpload(uploadId, key);
    res.status(200).json({ message: "Multipart upload aborted successfully" });
  } catch (error) {
    next(error);
  }
};
