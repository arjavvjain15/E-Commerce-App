import { processChat } from "../services/chat.services.js";
import Chat from "../models/chat.models.js";

export const handleChat= async(req,res,next)=>{
    try{
        const message= req.body;
        if(!message) return res.status(400).json({message:"Message is mandatory"});

        const userId= req.user.id;
        const today= new Date().toISOString().split("T")[0];

        let [usageRecord]= await Chat.findOrCreate({
            where: {userId},
            defaults: {
                queryCount:0,
                lastResetDate: today
            }
        });

        if(usageRecord.lastResetDate!==today){
            await usageRecord.update({
                queryCount: 0,
                lastResetDate: today
            });
        }
        //rate limiting
        if(usageRecord.queryCount>=20) return res.status(429).json({message:"You have exceeded your daily query limit",limitExceeded:"true"});

        const answer= await processChat(message);
        await usageRecord.queryCount("increment",{by: 1});
    }
    catch(error){
        next(error);
    }
};