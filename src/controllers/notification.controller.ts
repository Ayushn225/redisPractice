import { Request, Response, NextFunction } from "express";
import {
	NotificationPayload,
	publishNotification,
} from "../subscriber/notification.subscriber";

export async function publishNotificationController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { title, message } = req.body;
		const notification = {
			id: Date.now().toString(),
			title,
			message,
			createdAt: new Date().toISOString(),
		};

        //publisher going to publish
        await publishNotification(notification);

        res.status(201).json({
            success: true,
            message: "notification published successfully",
            data: {
                id: notification.id
            }
        });

	} catch (error) {
		next(error);
	}
}


