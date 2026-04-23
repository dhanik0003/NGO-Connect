import { Router } from "express";
import { Role } from "@prisma/client";
import { adminController } from "../controllers/admin.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  classifyReportSchema,
  escalateSchema,
  markInvalidSchema,
  mergeDuplicateSchema,
  routeReportSchema,
} from "../validators/report.validator";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.SUPER_ADMIN));

adminRouter.get("/dashboard", asyncHandler(adminController.dashboard));
adminRouter.get("/reports", asyncHandler(adminController.listReports));
adminRouter.get("/reports/:id", asyncHandler(adminController.getReport));
adminRouter.patch("/reports/:id/classify", validate(classifyReportSchema), asyncHandler(adminController.classify));
adminRouter.patch("/reports/:id/route", validate(routeReportSchema), asyncHandler(adminController.route));
adminRouter.patch("/reports/:id/mark-invalid", validate(markInvalidSchema), asyncHandler(adminController.markInvalid));
adminRouter.patch("/reports/:id/merge-duplicate", validate(mergeDuplicateSchema), asyncHandler(adminController.mergeDuplicate));
adminRouter.patch("/reports/:id/escalate", validate(escalateSchema), asyncHandler(adminController.escalate));
