import type { NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getSocketServer } from "../lib/socket";

interface NotificationPayload {
  recipientUserId: string;
  role: Role;
  title: string;
  body: string;
  type: NotificationType;
  meta?: Prisma.InputJsonValue;
}

export const notificationService = {
  async create(payload: NotificationPayload) {
    const notification = await prisma.notification.create({
      data: {
        recipientUserId: payload.recipientUserId,
        role: payload.role,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        meta: payload.meta,
      },
    });

    const socket = getSocketServer();
    socket?.to(`user:${payload.recipientUserId}`).emit("notification:new", notification);

    return notification;
  },

  async markAsRead(recipientUserId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientUserId,
      },
      data: {
        isRead: true,
      },
    });
  },

  async listForUser(recipientUserId: string) {
    return prisma.notification.findMany({
      where: { recipientUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
};
