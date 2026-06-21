import { NextFunction, Request, Response } from "express";
import redisClient from "../redis/client";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUEST = 5;

export async function productRateLimiter(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
        const ip = req.ip || 'unknown';
        const rateLimitKey =   `rateLimit:product:${ip}`;

        const reqCount = await redisClient.incr(rateLimitKey);

        if(reqCount===1){
            await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
            // console.log("rateLimit set for: ", rateLimitKey);
        }

        res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUEST);
        res.setHeader("X-RateLimit-Remaining", 
            Math.max(0, RATE_LIMIT_MAX_REQUEST - reqCount)
        );

        if(reqCount>RATE_LIMIT_MAX_REQUEST){
            return res.status(429).json({
                success: false,
                description: "Too many requests. Please try again later."
            });
        }

        next();


	} catch (err) {
		console.error("error: ", err);
        next(err);
	}
}
