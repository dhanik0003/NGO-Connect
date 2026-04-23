import type { Request, Response } from "express";
import { taskService } from "../services/task.service";

export const ngoController = {
  listTasks: async (req: Request, res: Response) => {
    const tasks = await taskService.listNgoTasks(req.user!.id);
    res.json({ success: true, data: tasks });
  },

  getTask: async (req: Request, res: Response) => {
    const task = await taskService.getNgoTask(req.user!.id, String(req.params.id));
    res.json({ success: true, data: task });
  },

  acceptTask: async (req: Request, res: Response) => {
    const task = await taskService.acceptTask(req.user!.id, String(req.params.id));
    res.json({ success: true, data: task });
  },

  rejectTask: async (req: Request, res: Response) => {
    const task = await taskService.rejectTask(req.user!.id, String(req.params.id), req.body.note ?? req.body.reason ?? "Rejected by NGO.");
    res.json({ success: true, data: task });
  },

  assignVolunteer: async (req: Request, res: Response) => {
    const task = await taskService.assignVolunteer(req.user!.id, String(req.params.id), req.body);
    res.json({ success: true, data: task });
  },

  reassign: async (req: Request, res: Response) => {
    const task = await taskService.reassignTask(req.user!.id, String(req.params.id), req.body);
    res.json({ success: true, data: task });
  },

  verify: async (req: Request, res: Response) => {
    const task = await taskService.verifyTask(req.user!.id, String(req.params.id), req.body);
    res.json({ success: true, data: task });
  },

  requestRework: async (req: Request, res: Response) => {
    const task = await taskService.requestRework(req.user!.id, String(req.params.id), req.body);
    res.json({ success: true, data: task });
  },

  volunteers: async (req: Request, res: Response) => {
    const volunteers = await taskService.listNgoVolunteers(req.user!.id);
    res.json({ success: true, data: volunteers });
  },

  surveyors: async (req: Request, res: Response) => {
    const surveyors = await taskService.listNgoSurveyors(req.user!.id);
    res.json({ success: true, data: surveyors });
  },

  dashboard: async (req: Request, res: Response) => {
    const dashboard = await taskService.getNgoDashboard(req.user!.id);
    res.json({ success: true, data: dashboard });
  },
};
