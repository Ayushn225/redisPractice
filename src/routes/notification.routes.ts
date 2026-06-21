import { Router } from "express";
import * as publishNotificationController from "../controllers/notification.controller"

const router = Router();

router.post("/", publishNotificationController.publishNotificationController)

export default router;