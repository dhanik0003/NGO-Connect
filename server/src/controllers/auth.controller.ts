import type { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  registerUser: async (req: Request, res: Response) => {
    const result = await authService.registerUser({
      ...req.body,
      profileImageUrl: req.uploadedFileUrl,
    });
    res.status(201).json({ success: true, data: result });
  },

  registerNgo: async (req: Request, res: Response) => {
    const result = await authService.registerNgo({
      ...req.body,
      verificationDocumentUrl: req.uploadedFileUrl,
    });
    res.status(201).json({ success: true, data: result });
  },

  registerSurveyor: async (req: Request, res: Response) => {
    const result = await authService.registerSurveyor({
      ...req.body,
      idProofUrl: req.uploadedFileUrl,
    });
    res.status(201).json({ success: true, data: result });
  },

  registerVolunteer: async (req: Request, res: Response) => {
    const result = await authService.registerVolunteer({
      ...req.body,
      idProofUrl: req.uploadedFileUrl,
    });
    res.status(201).json({ success: true, data: result });
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  },

  refresh: async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  },

  logout: async (req: Request, res: Response) => {
    const result = await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: result });
  },

  forgotPassword: async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
  },

  resetPassword: async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: result });
  },

  me: async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.id);
    res.json({ success: true, data: result });
  },

  updateMe: async (req: Request, res: Response) => {
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: result });
  },
};
