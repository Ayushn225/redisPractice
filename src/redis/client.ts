import { createClient } from "redis";
import dotenv from 'dotenv';
dotenv.config();

const redis_url = process.env.REDIS_URL;

const redisClient = createClient({url: redis_url});

redisClient.on("connect", ()=>{
    console.log("connected to redis");
});

redisClient.on("error", (error)=>{
    console.log("error in redis: ", error);
});

redisClient.on("end", ()=>{
    console.log("end the connection to redis");
});

export async function connectRedis():Promise<void>{
    if(!redisClient.isOpen){
        await redisClient.connect();
    }

    const pong = await redisClient.ping();
    console.log("redis ping response: ", pong);
}

export async function disconnectRedis(): Promise<void>{
    if(redisClient.isOpen){
        await redisClient.quit();
    }
}

export default redisClient;