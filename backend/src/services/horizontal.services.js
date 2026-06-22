import {Horizontal} from "../models/index.js";

export const getAllHorizontal=async()=>{
    return await Horizontal.findAll();
}

export const createHorizontal= async({bg})=>{
    return await Horizontal.create({bg});
}

export const updateHorizontal= async(id,{bg})=>{
    const hori= await Horizontal.findByPk(id);
    if(!hori){
        const error=new Error("Horizontal banner not found");
        error.status=404;
        throw error;
    }
    await hori.update({
        bg: bg!==undefined?bg:hori.bg,
    }); 
    return hori;
}

export const deleteHorizontal= async(id)=>{
    const hori= await Horizontal.findByPk(id);
    if(!hori){
        const error=new Error("Horizontal banner not found");
        error.status=404;
        throw error;
    }
    await hori.destroy();
    return true;
}
