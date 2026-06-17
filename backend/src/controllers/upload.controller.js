import {abortMultipartUpload, completeMultipartUpload, startMultipartUpload, uploadPart, uploadToS3} from "../services/upload.services.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No File Found" });
    const imageUrl = await uploadToS3(req.file);
    res.status(200).json({ imageUrl, originalName: req.file.originalname });
  } catch (error) {
    next(error);
  }
};

export const startMultipart= async(req,res,next)=>{
    try{
        const {fileName,contentType}= req.body;
        if(!fileName) return res.status(400).json({message:"FileName is Mandatory"});
        const result= await startMultipartUpload(fileName,contentType);
        res.status(200).json(result);
    }
    catch(error){
        next(error);
    }
};

export const uploadPartHandler= async(req,res,next)=>{
    try{
        const {uploadId,key,partNumber}= req.body;
        if(!uploadId|| !key||!partNumber) return res.status(400).json({messgae:"These fields are mandatory"});
        if(!req.file) return res.status(400).json({messgae:"Chunk is missing"});
        const result= await uploadPart(uploadId,key,partNumber,req.file.buffer);
        res.status(200).json(result);
    }
    catch(error){
        next(error);
    }
};

export const completeMultipart= async(req,res,next)=>{
    try{
        const {uploadId,key,parts}= req.body;
        if(!uploadId|| !key|| !parts) return res.status(400).json({message:"These fields are mandatory"});
        const imageUrl= await completeMultipartUpload(uploadId,key,parts);
        res.status(200).json({imageUrl});
    }
    catch(error){
        next(error);
    }
};

export const abortMultipart= async(req,res,next)=>{
    try{
        const {uploadId,key}= req.body;
        if(!uploadId||!key) return res.status(400).json({message:"UploadId and Key are required"});
        await abortMultipartUpload(uploadId,key);
        res.status(200).json({message:"Multipart upload aborted"});
    }
    catch(error){
        next(error);
    }
};