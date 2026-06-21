import { createClient } from "redis";
import redisClient from "../redis/client";
import dotenv from "dotenv";
dotenv.config();

const notification_channel = "notification";
const redis_url = process.env.REDIS_URL;

export interface NotificationPayload{
    id: string;
    title: string;
    message: string;
    createdAt: string;
}

export async function publishNotification(notification: NotificationPayload): Promise<void>{
    await redisClient.publish(notification_channel, JSON.stringify(notification));
}

const subscriberClient = createClient({url: redis_url});

subscriberClient.on("error", (error)=>{
    console.log("error on subscriber: ", error);
});

async function startNotificationSubscriber(){
    await subscriberClient.connect();

    await subscriberClient.subscribe(notification_channel, (message)=>{
        try{
            const notification = JSON.parse(message) as NotificationPayload;

            console.log("new notification recieved (new) ");
            console.log("title: ", notification.title);
            console.log("message: ", notification.message);
            console.log("created at: ", notification.createdAt);

        }catch{
            console.log("new notification recieved (new) ", message);
        }
    })
}

startNotificationSubscriber().catch((error)=>{
    console.log("error in notification start: ", error);
    process.exit(1);
})