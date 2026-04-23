"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngoController = void 0;
const task_service_1 = require("../services/task.service");
exports.ngoController = {
    listTasks: async (req, res) => {
        const tasks = await task_service_1.taskService.listNgoTasks(req.user.id);
        res.json({ success: true, data: tasks });
    },
    getTask: async (req, res) => {
        const task = await task_service_1.taskService.getNgoTask(req.user.id, String(req.params.id));
        res.json({ success: true, data: task });
    },
    acceptTask: async (req, res) => {
        const task = await task_service_1.taskService.acceptTask(req.user.id, String(req.params.id));
        res.json({ success: true, data: task });
    },
    rejectTask: async (req, res) => {
        const task = await task_service_1.taskService.rejectTask(req.user.id, String(req.params.id), req.body.note ?? req.body.reason ?? "Rejected by NGO.");
        res.json({ success: true, data: task });
    },
    assignVolunteer: async (req, res) => {
        const task = await task_service_1.taskService.assignVolunteer(req.user.id, String(req.params.id), req.body);
        res.json({ success: true, data: task });
    },
    reassign: async (req, res) => {
        const task = await task_service_1.taskService.reassignTask(req.user.id, String(req.params.id), req.body);
        res.json({ success: true, data: task });
    },
    verify: async (req, res) => {
        const task = await task_service_1.taskService.verifyTask(req.user.id, String(req.params.id), req.body);
        res.json({ success: true, data: task });
    },
    requestRework: async (req, res) => {
        const task = await task_service_1.taskService.requestRework(req.user.id, String(req.params.id), req.body);
        res.json({ success: true, data: task });
    },
    volunteers: async (req, res) => {
        const volunteers = await task_service_1.taskService.listNgoVolunteers(req.user.id);
        res.json({ success: true, data: volunteers });
    },
    surveyors: async (req, res) => {
        const surveyors = await task_service_1.taskService.listNgoSurveyors(req.user.id);
        res.json({ success: true, data: surveyors });
    },
    dashboard: async (req, res) => {
        const dashboard = await task_service_1.taskService.getNgoDashboard(req.user.id);
        res.json({ success: true, data: dashboard });
    },
};
