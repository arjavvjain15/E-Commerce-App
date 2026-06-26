import { getAllBanners,createBanner,updateBanner,deleteBanner} from "../services/banner.services.js";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const isAdminRequest= async(req)=>{
    const accessToken= req.cookies?.accessToken;
    if(!accessToken) return false;
    try{
        const decoded= jwt.verify(accessToken,process.env.ACCESS_SECRET);
        const user= await User.findByPk(decoded.userId);
        return user&& user.role==="admin";
    }
    catch(error){
        return false;
    }
};



export const getAll=async(req,res,next)=>{
    try{
        const includeDrafts = req.query.includeDrafts === "true" && (await isAdminRequest(req));
        const banner=await getAllBanners({ includeDrafts });
        res.status(200).json(banner);
    }
    catch(error){
        next(error);
    }
};

export const create=async(req,res,next)=>{
    try{
        const {badge,title,subtitle,bg,imageUrl,categoryId,status}=req.body;
        if(!title) return res.status(400).json({message:"Title is Mandatory"});
        const banner=await createBanner({badge,title,subtitle,bg,imageUrl,categoryId,status});
        res.status(201).json(banner);
    }catch(error){
        next(error);
    }
}

export const remove=async(req,res,next)=>{
    try{
        await deleteBanner(req.params.id);
        res.status(200).json({message:"Banner Removed"});
    }
    catch(error){
        next(error);
    }
};

export const update=async(req,res,next)=>{
    try{
        const banner=await updateBanner(req.params.id,req.body);
        res.status(200).json(banner);
    }
    catch(error){
        next(error);
    }
};

