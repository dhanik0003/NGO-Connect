import { Router } from "express";
import { Role } from "@prisma/client";
import { surveyorController } from "../controllers/surveyor.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { attachSingleUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { surveyorReportSchema } from "../validators/report.validator";

export const surveyorRouter = Router();

surveyorRouter.use(requireAuth, requireRole(Role.SURVEYOR));

surveyorRouter.post("/reports", attachSingleUpload("media"), validate(surveyorReportSchema), asyncHandler(surveyorController.createReport));
surveyorRouter.get("/reports", asyncHandler(surveyorController.listReports));
surveyorRouter.get("/dashboard", asyncHandler(surveyorController.dashboard));
surveyorRouter.get("/region", asyncHandler(surveyorController.region));
