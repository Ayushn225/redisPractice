import { createClient, RedisClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redis_url = process.env.REDIS_URL;

const channel = "demo:notification";

async function run() {
	const publisher = createClient({ url: redis_url });
	const subscriber = createClient({ url: redis_url });
	const subscriber2 = createClient({ url: redis_url });

	await publisher.connect();
	console.log("publisher ping: ", await publisher.ping());
	console.log("publisher conneced");

	await subscriber.connect();
	console.log("subscriber ping: ", await subscriber.ping());
	console.log("subscriber connected");

	await subscriber2.connect();
	console.log("subscriber2 ping: ", await subscriber2.ping());
	console.log("subscriber2 connected");

	await subscriber.subscribe(channel, (message) => {
		const data = JSON.parse(message);
		console.log(data);
	});

	await subscriber2.subscribe(channel, (message) => {
		const data = JSON.parse(message);
		console.log(data);
	});

	console.log("subscribed to channel: ", channel);
	console.log("publisher is now sending code: ");

	const event = {
		title: "uploading_channel",
		messgae: "this is uploaded message",
	};

	const recover = await publisher.publish(channel, JSON.stringify(event));
	console.log("published");
	await publisher.publish(
		channel,
		JSON.stringify({
			title: "2nd message",
			message: "2nd message lol",
		}),
	);
	console.log(recover);

	await new Promise((resolve) => setTimeout(resolve, 300));

	await subscriber.unsubscribe(channel);
	await subscriber2.unsubscribe(channel);

	await subscriber.quit();
	await subscriber2.quit();
	await publisher.quit();
}

run().catch((error) => {
	console.log("error : ", error);
	process.exit(1);
});
