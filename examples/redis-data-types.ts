import dotenv from 'dotenv';
import { createClient } from 'redis';
dotenv.config();

const Redis_url = process.env.REDIS_URL;

const redisClient = createClient({url: Redis_url});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run(){
    await redisClient.connect();
    console.log("connected");

    console.log("ping-> ", await redisClient.ping());

    const stringKey = "example_string";
    await redisClient.set(stringKey, "100");

    const pageViews = await redisClient.get(stringKey);
    console.log(pageViews);

    const afterInc = await redisClient.incr(stringKey);
    console.log(afterInc);

    //hash
    const hashKey = "demo:hash";
    await redisClient.hSet(hashKey, {
        name: "harsh",
        city: "bombay"
    });

    await redisClient.hSet(hashKey, {
        name: "kushagra",
        city: "delhi"
    });

    const hashVal = await redisClient.hGetAll(hashKey);
    console.log(hashVal);

    //list
    const listKey = "demo:list";

    // await redisClient.lPush(listKey, "hi");
    // await redisClient.lPush(listKey, "hello, redis");
    // await redisClient.rPush(listKey, "kese ho? ");

    const listVal = await redisClient.lRange(listKey, 0, -1);
    console.log(listVal);

    //set
    const setKey = "demo:setKey";
    await redisClient.sAdd(setKey, "nodejs");
    await redisClient.sAdd(setKey, "nodejs");
    await redisClient.sAdd(setKey, "express");

    const setVal = await redisClient.sCard(setKey);
    console.log(setVal);

    //ttl
    const otpKey = "demo:ttl";
    await redisClient.set(otpKey, "1234");
    await redisClient.expire(otpKey, 60);
    await sleep(3000);
    const ttl = await redisClient.ttl(otpKey);

    console.log(ttl);

    await redisClient.quit();
    console.log("exited successfully");
}   

run().catch((error) => {
    console.log("error : ", error);
    process.exit(1);
})