import { createClient } from "redis";

const redisUrl=process.env.REDIS_URL|| "redis://127.0.0.1:6379";

const redisClient= createClient({
    url: redisUrl
});

redisClient.on("error",(err)=>{
    console.error("[Redis] Client Error: ", err.message);
});

redisClient.on("connect",()=>{
    console.log("[Redis] Client Connecting");
});

redisClient.on("ready",()=>{
    console.log("Client connected and ready to use");
});

(async ()=>{
    try{
        await redisClient.connect();
    }
    catch(err){
        console.error("[Redis] Client Error: ",err.message);
    }
});

export default redisClient;