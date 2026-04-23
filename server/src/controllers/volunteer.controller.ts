import type { Request, Response } from "express";
import { taskService } from "../services/task.service";

export const volunteerController = {
  listTasks: async (req: Request, res: Response) => {
    const tasks = await taskService.listVolunteerTasks(req.user!.id);
    res.json({ success: true, data: tasks });
  },

  getTask: async (req: Request, res: Response) => {
    const task = await taskService.getVolunteerTask(req.user!.id, String(req.params.id));
    res.json({ success: true, data: task });
  },

  acceptTask: async (req: Request, res: Response) => {
    const task = await taskService.respondToAssignment(req.user!.id, String(req.params.id), true, req.body.note);
    res.json({ success: true, data: task });
  },

  rejectTask: async (req: Request, res: Response) => {
    const task = await taskService.respondToAssignment(req.user!.id, String(req.params.id), false, req.body.note);
    res.json({ success: true, data: task });
  },

  updateStatus: async (req: Request, res: Response) => {
    const task = await taskService.updateVolunteerTaskStatus(req.user!.id, String(req.params.id), req.body);
    res.json({ success: true, data: task });
  },

  uploadEvidence: async (req: Request, res: Response) => {
    const task = await taskService.uploadEvidence(req.user!.id, String(req.params.id), {
      note: req.body.note,
      mediaUrl: req.uploadedFileUrl ?? req.body.mediaUrl,
      mediaType: req.uploadedFileType ?? req.body.mediaType ?? "application/octet-stream",
    });
    res.status(201).json({ success: true, data: task });
  },

  updateAvailability: async (req: Request, res: Response) => {
    const profile = await taskService.updateAvailability(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  },

  dashboard: async (req: Request, res: Response) => {
    const dashboard = await taskService.getVolunteerDashboard(req.user!.id);
    res.json({ success: true, data: dashboard });
  },
};
