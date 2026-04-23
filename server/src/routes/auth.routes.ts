import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate";
import {
  forgotPasswordSchema,
  loginSchema,
  ngoRegistrationSchema,
  refreshSchema,
  resetPasswordSchema,
  surveyorRegistrationSchema,
  updateProfileSchema,
  userRegistrationSchema,
  volunteerRegistrationSchema,
} from "../validators/auth.validator";
import { attachSingleUpload } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post(
  "/register/user",
  attachSingleUpload("profileImage"),
  validate(userRegistrationSchema),
  asyncHandler(authController.registerUser),
);
authRouter.post(
  "/register/ngo",
  attachSingleUpload("verificationDocument"),
  validate(ngoRegistrationSchema),
  asyncHandler(authController.registerNgo),
);
authRouter.post(
  "/register/surveyor",
  attachSingleUpload("idProof"),
  validate(surveyorRegistrationSchema),
  asyncHandler(authController.registerSurveyor),
);
authRouter.post(
  "/register/volunteer",
  attachSingleUpload("idProof"),
  validate(volunteerRegistrationSchema),
  asyncHandler(authController.registerVolunteer),
);
authRouter.post("/login", validate(loginSchema), asyncHandler(authController.login));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));
authRouter.post("/logout", validate(refreshSchema), asyncHandler(authController.logout));
authRouter.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
authRouter.patch("/me", requireAuth, validate(updateProfileSchema), asyncHandler(authController.updateMe));
