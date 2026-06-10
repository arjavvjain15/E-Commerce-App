import { getAllBanners,createBanner,updateBanner,deleteBanner} from "../services/banner.services";

export const getAll=async(req,res,next)=>{
    try{
        const banner=await getAllBanners();
        res.status(200).json(banner);
    }
    catch(error){
        next(error);
    }
};

export const create=async(req,res,next)=>{
    try{
        const {badge,title,subtitle,bg,imageUrl,categoryId}=req.body;
        if(!title) res.status(400).json({message:"Title is Mandatory"});
        const banner=await createBanner(badge,title,subtitle,bg,imageUrl,categoryId);
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

