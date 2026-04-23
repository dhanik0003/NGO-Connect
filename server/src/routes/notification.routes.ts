import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth } from "../middleware/auth";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", asyncHandler(notificationController.list));
notificationRouter.patch("/:id/read", asyncHandler(notificationController.read));
