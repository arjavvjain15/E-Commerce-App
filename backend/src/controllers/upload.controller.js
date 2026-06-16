import { uploadToS3 } from "../services/upload.services.js";

export const uploadImage= async(req,res,next)=>{
    try{
        if(!req.file) return res.status(400).json({message:"No File Found"});
        const imageUrl=await uploadToS3(req.file);
        res.status(200).json({imageUrl,originalName: req.file.originalname});
    }
    catch(error){
        next(error);
    }
}

