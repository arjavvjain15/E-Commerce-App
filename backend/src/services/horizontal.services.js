import {Horizontal} from "../models/index.js";

export const getAllHorizontal=async({ includeDrafts = false } = {})=>{
    const where = {};
    if (!includeDrafts) {
        where.status = "active";
    }
    return await Horizontal.findAll({ where });
}

export const createHorizontal= async({bg, status})=>{
    return await Horizontal.create({
        bg,
        status: status || "active"
    });
}

export const updateHorizontal= async(id,{bg, status})=>{
    const hori= await Horizontal.findByPk(id);
    if(!hori){
        const error=new Error("Horizontal banner not found");
        error.status=404;
        throw error;
    }
    await hori.update({
        bg: bg!==undefined?bg:hori.bg,
        status: status!==undefined?status: hori.status,
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
