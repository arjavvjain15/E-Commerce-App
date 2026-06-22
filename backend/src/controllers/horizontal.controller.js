import { getAllHorizontal,createHorizontal,updateHorizontal,deleteHorizontal } from "../services/horizontal.services.js";

export const getAll= async(req,res,next)=>{
    try{
        const hori= await getAllHorizontal();
        res.status(200).json(hori);
    }
    catch(error){
        next(error);
    }
}

export const create= async(req,res,next)=>{
    try{
        const {bg}= req.body;
        if(!bg) return res.status(400).json({message: "Background is required"});
        const hori= await createHorizontal({bg});
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