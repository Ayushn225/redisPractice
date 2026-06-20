import dotenv from 'dotenv';
import { createClient } from 'redis';
dotenv.config();

const Redis_url = process.env.REDIS_URL;

const redisClient = createClient({url: Redis_url});

const cacheKey = "demo:caching";
const CACHE_TTL_SECONDS = 60;

let dbProducts = ["keyboard", "mouse", "laptop"];

async function run(){
    await redisClient.connect();

    let cached = await redisClient.get(cacheKey);
    if(cached){
        console.log("cache hit");
        console.log("data: ", JSON.parse(cached));

        dbProducts = ["keyboard", "mouse", "laptop", "speaker"];
        
        await redisClient.del(cacheKey);
        cached = await redisClient.get(cacheKey);

        if(!cached){
            const freshProducts = dbProducts;
            await redisClient.setEx(cacheKey, 60, JSON.stringify(freshProducts));
        }
    }else{
        console.log("cache miss");
        const product = dbProducts;

        //set
        await redisClient.setEx(cacheKey, 60, JSON.stringify(product));

        

    }

    await redisClient.quit();
}

run().catch((error) => {
    console.log("error : ", error);
    process.exit(1);
})