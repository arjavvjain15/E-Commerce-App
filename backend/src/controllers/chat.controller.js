import { processChat } from "../services/chat.services.js";
import Chat from "../models/chat.models.js";


export const handleChat= async(req,res,next)=>{
    try{
        const { message,history=[] } = req.body;
        if(!message) return res.status(400).json({message:"Message is mandatory"});
        if(message.length>1000) return res.status(400).json({message:"Message Too Long"});

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
        if(usageRecord.queryCount>=50) return res.status(429).json({message:"You have exceeded your daily query limit",limitExceeded:"true"});

        try{
            const answer= await processChat(message,history);
            await usageRecord.increment("queryCount",{by: 1});
            return res.status(200).json({answer});
        }
        catch(error){
            console.error(error);
            return res.status(500).json({message: "AI Assistant is not available at this moment. Please try later"});
        }
    }
    catch(error){
        next(error);
    }

};