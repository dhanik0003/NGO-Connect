"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notification_service_1 = require("../services/notification.service");
exports.notificationController = {
    list: async (req, res) => {
        const data = await notification_service_1.notificationService.listForUser(req.user.id);
        res.json({ success: true, data });
    },
    read: async (req, res) => {
        const data = await notification_service_1.notificationService.markAsRead(req.user.id, String(req.params.id));
        res.json({ success: true, data });
    },
};
