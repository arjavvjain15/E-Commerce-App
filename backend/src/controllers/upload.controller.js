import { uploadToS3 } from "../services/upload.services.js";

export const uploadImage= async(req,res,next)=>{
    try{
        if(!req.file) return res.status(400).json({messgae:"No file found"});
        imageUrl=await uploadToS3(req.file);
        res.status(200).json({imageUrl});
    }
    catch(error){
        next(error);
    }
}

