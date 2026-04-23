"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.volunteerController = void 0;
const task_service_1 = require("../services/task.service");
exports.volunteerController = {
    listTasks: async (req, res) => {
        const tasks = await task_service_1.taskService.listVolunteerTasks(req.user.id);
        res.json({ success: true, data: tasks });
    },
    getTask: async (req, res) => {
        const task = await task_service_1.taskService.getVolunteerTask(req.user.id, String(req.params.id));
        res.json({ success: true, data: task });
    },
    acceptTask: async (req, res) => {
        const task = await task_service_1.taskService.respondToAssignment(req.user.id, String(req.params.id), true, req.body.note);
        res.json({ success: true, data: task });
    },
    rejectTask: async (req, res) => {
        const task = await task_service_1.taskService.respondToAssignment(req.user.id, String(req.params.id), false, req.body.note);
        res.json({ success: true, data: task });
    },
    updateStatus: async (req, res) => {
        const task = await task_service_1.taskService.updateVolunteerTaskStatus(req.user.id, String(req.params.id), req.body);
        res.json({ success: true, data: task });
    },
    uploadEvidence: async (req, res) => {
        const task = await task_service_1.taskService.uploadEvidence(req.user.id, String(req.params.id), {
            note: req.body.note,
            mediaUrl: req.uploadedFileUrl ?? req.body.mediaUrl,
            mediaType: req.uploadedFileType ?? req.body.mediaType ?? "application/octet-stream",
        });
        res.status(201).json({ success: true, data: task });
    },
    updateAvailability: async (req, res) => {
        const profile = await task_service_1.taskService.updateAvailability(req.user.id, req.body);
        res.json({ success: true, data: profile });
    },
    dashboard: async (req, res) => {
        const dashboard = await task_service_1.taskService.getVolunteerDashboard(req.user.id);
        res.json({ success: true, data: dashboard });
    },
};
