import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { reportService } from "../services/report.service";

export const adminController = {
  dashboard: async (_req: Request, res: Response) => {
    const data = await dashboardService.getAdminDashboard();
    res.json({ success: true, data });
  },

  listReports: async (req: Request, res: Response) => {
    const reports = await reportService.listAdminReports({
      status: req.query.status as never,
      priorityLabel: req.query.priorityLabel as never,
    });
    res.json({ success: true, data: reports });
  },

  getReport: async (req: Request, res: Response) => {
    const report = await reportService.getReportForUser(req.user!.id, req.user!.role, String(req.params.id));
    res.json({ success: true, data: report });
  },

  classify: async (req: Request, res: Response) => {
    const report = await reportService.classifyReport(String(req.params.id), req.user!.id, req.body.categorySlug);
    res.json({ success: true, data: report });
  },

  route: async (req: Request, res: Response) => {
    const report = await reportService.routeReport(String(req.params.id), req.body.ngoId, req.user!.id);
    res.json({ success: true, data: report });
  },

  markInvalid: async (req: Request, res: Response) => {
    const report = await reportService.markInvalid(String(req.params.id), req.user!.id, req.body.reason);
    res.json({ success: true, data: report });
  },

  mergeDuplicate: async (req: Request, res: Response) => {
    const report = await reportService.mergeDuplicate(String(req.params.id), req.user!.id, req.body.canonicalReportId);
    res.json({ success: true, data: report });
  },

  escalate: async (req: Request, res: Response) => {
    const report = await reportService.escalate(String(req.params.id), req.user!.id, req.body.reason);
    res.json({ success: true, data: report });
  },
};
