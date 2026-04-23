import type { Request, Response } from "express";
import { reportService } from "../services/report.service";

export const reportController = {
  create: async (req: Request, res: Response) => {
    const report = await reportService.createCitizenReport({
      actorUserId: req.user!.id,
      ...req.body,
      mediaUrl: req.uploadedFileUrl,
      mediaType: req.uploadedFileType,
    });

    res.status(201).json({ success: true, data: report });
  },

  listMine: async (req: Request, res: Response) => {
    const reports = await reportService.getMyReports(req.user!.id);
    res.json({ success: true, data: reports });
  },

  getOne: async (req: Request, res: Response) => {
    const report = await reportService.getReportForUser(req.user!.id, req.user!.role, String(req.params.id));
    res.json({ success: true, data: report });
  },
};
