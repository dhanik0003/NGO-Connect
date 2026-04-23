import { Router } from "express";
import { Role } from "@prisma/client";
import { volunteerController } from "../controllers/volunteer.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { attachSingleUpload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import {
  updateAvailabilitySchema,
  uploadEvidenceSchema,
  volunteerTaskResponseSchema,
  volunteerTaskStatusSchema,
} from "../validators/task.validator";

export const volunteerRouter = Router();

volunteerRouter.use(requireAuth, requireRole(Role.VOLUNTEER));

volunteerRouter.get("/tasks", asyncHandler(volunteerController.listTasks));
volunteerRouter.get("/tasks/:id", asyncHandler(volunteerController.getTask));
volunteerRouter.patch("/tasks/:id/accept", validate(volunteerTaskResponseSchema), asyncHandler(volunteerController.acceptTask));
volunteerRouter.patch("/tasks/:id/reject", validate(volunteerTaskResponseSchema), asyncHandler(volunteerController.rejectTask));
volunteerRouter.patch("/tasks/:id/status", validate(volunteerTaskStatusSchema), asyncHandler(volunteerController.updateStatus));
volunteerRouter.post("/tasks/:id/evidence", attachSingleUpload("media"), validate(uploadEvidenceSchema), asyncHandler(volunteerController.uploadEvidence));
volunteerRouter.patch("/availability", validate(updateAvailabilitySchema), asyncHandler(volunteerController.updateAvailability));
volunteerRouter.get("/dashboard", asyncHandler(volunteerController.dashboard));
