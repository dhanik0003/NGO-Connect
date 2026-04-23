"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const prisma_1 = require("../lib/prisma");
const socket_1 = require("../lib/socket");
exports.notificationService = {
    async create(payload) {
        const notification = await prisma_1.prisma.notification.create({
            data: {
                recipientUserId: payload.recipientUserId,
                role: payload.role,
                title: payload.title,
                body: payload.body,
                type: payload.type,
                meta: payload.meta,
            },
        });
        const socket = (0, socket_1.getSocketServer)();
        socket?.to(`user:${payload.recipientUserId}`).emit("notification:new", notification);
        return notification;
    },
    async markAsRead(recipientUserId, notificationId) {
        return prisma_1.prisma.notification.updateMany({
            where: {
                id: notificationId,
                recipientUserId,
            },
            data: {
                isRead: true,
            },
        });
    },
    async listForUser(recipientUserId) {
        return prisma_1.prisma.notification.findMany({
            where: { recipientUserId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    },
};
