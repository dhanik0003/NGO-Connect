import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth } from "../middleware/auth";

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get("/status", asyncHandler(aiController.status));
aiRouter.post("/classify-domain", asyncHandler(aiController.classifyDomain));
aiRouter.post("/score-priority", asyncHandler(aiController.scorePriority));
aiRouter.post("/match-ngo", asyncHandler(aiController.matchNgo));
aiRouter.post("/match-volunteer", asyncHandler(aiController.matchVolunteer));
aiRouter.post("/check-duplicate", asyncHandler(aiController.checkDuplicate));
