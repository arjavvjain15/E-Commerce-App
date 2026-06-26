import {Banner,Category} from "../models/index.js";

export const getAllBanners=async({ includeDrafts = false } = {})=>{
    const where = {};
    if (!includeDrafts) {
        where.status = "active";
    }
    return await Banner.findAll({
        where,
        include:[{model:Category,attributes:["id","name"]}]
    });
}

export const createBanner=async({badge,title,subtitle,bg,imageUrl,categoryId,status})=>{
    return await Banner.create({
        badge,title,subtitle,imageUrl,bg,categoryId: categoryId ||null,
        status: status || "active"
    });
}

export const updateBanner=async(id,{badge,title,subtitle,bg,imageUrl,categoryId,status})=>{
    const banner=await Banner.findByPk(id);
    if(!banner){
        const error=new Error("Banner not found");
        error.status=404;
        throw error;
    }
    await banner.update({
        badge: badge!==undefined?badge:banner.badge,
        title: title!==undefined?title:banner.title,
        subtitle: subtitle!==undefined?subtitle:banner.subtitle,
        bg: bg!==undefined?bg:banner.bg,
        imageUrl: imageUrl!==undefined?imageUrl:banner.imageUrl,
        categoryId: categoryId!==undefined?categoryId:banner.categoryId,
        status: status!==undefined?status:banner.status,
    });
    return banner;
}

export const deleteBanner=async(id)=>{
    const banner=await Banner.findByPk(id);
    if(!banner){
        const error=new Error("Banner not found");
        error.status=404;
        throw error;
    }
    await banner.destroy();
    return true;
}
