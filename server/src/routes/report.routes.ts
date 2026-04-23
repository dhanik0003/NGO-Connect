import { Router } from "express";
import { Role } from "@prisma/client";
import { reportController } from "../controllers/report.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { attachSingleUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { createReportSchema } from "../validators/report.validator";

export const reportRouter = Router();

reportRouter.use(requireAuth, requireRole(Role.USER));

reportRouter.post("/", attachSingleUpload("media"), validate(createReportSchema), asyncHandler(reportController.create));
reportRouter.get("/my", asyncHandler(reportController.listMine));
reportRouter.get("/:id", asyncHandler(reportController.getOne));
