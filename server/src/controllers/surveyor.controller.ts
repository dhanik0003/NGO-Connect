import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { reportService } from "../services/report.service";

export const surveyorController = {
  createReport: async (req: Request, res: Response) => {
    const report = await reportService.createSurveyorReport({
      actorUserId: req.user!.id,
      ...req.body,
      mediaUrl: req.uploadedFileUrl,
      mediaType: req.uploadedFileType,
    });
    res.status(201).json({ success: true, data: report });
  },

  listReports: async (req: Request, res: Response) => {
    const reports = await reportService.getMyReports(req.user!.id);
    res.json({ success: true, data: reports });
  },

  dashboard: async (req: Request, res: Response) => {
    const data = await dashboardService.getSurveyorDashboard(req.user!.id);
    res.json({ success: true, data });
  },

  region: async (req: Request, res: Response) => {
    const data = await dashboardService.getSurveyorDashboard(req.user!.id);
    res.json({
      success: true,
      data: data.surveyor,
    });
  },
};
