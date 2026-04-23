import { Router } from "express";
import { Role } from "@prisma/client";
import { ngoController } from "../controllers/ngo.controller";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  assignVolunteerSchema,
  reassignTaskSchema,
  requestReworkSchema,
  verifyTaskSchema,
} from "../validators/task.validator";

export const ngoRouter = Router();

ngoRouter.use(requireAuth, requireRole(Role.NGO_ADMIN));

ngoRouter.get("/tasks", asyncHandler(ngoController.listTasks));
ngoRouter.get("/tasks/:id", asyncHandler(ngoController.getTask));
ngoRouter.patch("/tasks/:id/accept", asyncHandler(ngoController.acceptTask));
ngoRouter.patch("/tasks/:id/reject", validate(requestReworkSchema), asyncHandler(ngoController.rejectTask));
ngoRouter.patch("/tasks/:id/assign-volunteer", validate(assignVolunteerSchema), asyncHandler(ngoController.assignVolunteer));
ngoRouter.patch("/tasks/:id/reassign", validate(reassignTaskSchema), asyncHandler(ngoController.reassign));
ngoRouter.patch("/tasks/:id/verify", validate(verifyTaskSchema), asyncHandler(ngoController.verify));
ngoRouter.patch("/tasks/:id/request-rework", validate(requestReworkSchema), asyncHandler(ngoController.requestRework));
ngoRouter.get("/volunteers", asyncHandler(ngoController.volunteers));
ngoRouter.get("/surveyors", asyncHandler(ngoController.surveyors));
ngoRouter.get("/dashboard", asyncHandler(ngoController.dashboard));
