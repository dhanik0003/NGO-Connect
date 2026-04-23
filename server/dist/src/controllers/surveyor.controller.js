"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surveyorController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const report_service_1 = require("../services/report.service");
exports.surveyorController = {
    createReport: async (req, res) => {
        const report = await report_service_1.reportService.createSurveyorReport({
            actorUserId: req.user.id,
            ...req.body,
            mediaUrl: req.uploadedFileUrl,
            mediaType: req.uploadedFileType,
        });
        res.status(201).json({ success: true, data: report });
    },
    listReports: async (req, res) => {
        const reports = await report_service_1.reportService.getMyReports(req.user.id);
        res.json({ success: true, data: reports });
    },
    dashboard: async (req, res) => {
        const data = await dashboard_service_1.dashboardService.getSurveyorDashboard(req.user.id);
        res.json({ success: true, data });
    },
    region: async (req, res) => {
        const data = await dashboard_service_1.dashboardService.getSurveyorDashboard(req.user.id);
        res.json({
            success: true,
            data: data.surveyor,
        });
    },
};
