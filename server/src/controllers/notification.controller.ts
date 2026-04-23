import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

export const notificationController = {
  list: async (req: Request, res: Response) => {
    const data = await notificationService.listForUser(req.user!.id);
    res.json({ success: true, data });
  },

  read: async (req: Request, res: Response) => {
    const data = await notificationService.markAsRead(req.user!.id, String(req.params.id));
    res.json({ success: true, data });
  },
};
