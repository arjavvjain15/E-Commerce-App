import { getAllHorizontal,createHorizontal,updateHorizontal,deleteHorizontal } from "../services/horizontal.services.js";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const isAdminRequest= async(req)=>{
    const accessToken= req.cookies?.accessToken;
    if(!accessToken) return false;
    try{
        const decoded=jwt.verify(accessToken,process.env.ACCESS_SECRET);
        const user= await User.findByPk(decoded.userId);
        return user&& user.role==="admin";
    }
    catch(error){
        return false;
    }
};

export const getAll= async(req,res,next)=>{
    try{
        const includeDrafts = req.query.includeDrafts === "true" && (await isAdminRequest(req));
        const hori= await getAllHorizontal({ includeDrafts });
        res.status(200).json(hori);
    }
    catch(error){
        next(error);
    }
}

export const create= async(req,res,next)=>{
    try{
        const {bg,status}= req.body;
        if(!bg) return res.status(400).json({message: "Background is required"});
        const hori= await createHorizontal({bg,status});
        res.status(201).json(hori);
    }
    catch(error){
        next(error);
    }
}

export const update= async(req,res,next)=>{
    try{
        const hori=await updateHorizontal(req.params.id,req.body);
        res.status(200).json(hori);
    }
    catch(error){
        next(error); 
    }
}

export const remove= async(req,res,next)=>{
    try{
        await deleteHorizontal(req.params.id);
        res.status(200).json({message: "Horizontal Banner deleted"})
    }
    catch(error){
        next(error);
    }
}