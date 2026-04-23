"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const report_service_1 = require("../services/report.service");
exports.adminController = {
    dashboard: async (_req, res) => {
        const data = await dashboard_service_1.dashboardService.getAdminDashboard();
        res.json({ success: true, data });
    },
    listReports: async (req, res) => {
        const reports = await report_service_1.reportService.listAdminReports({
            status: req.query.status,
            priorityLabel: req.query.priorityLabel,
        });
        res.json({ success: true, data: reports });
    },
    getReport: async (req, res) => {
        const report = await report_service_1.reportService.getReportForUser(req.user.id, req.user.role, String(req.params.id));
        res.json({ success: true, data: report });
    },
    classify: async (req, res) => {
        const report = await report_service_1.reportService.classifyReport(String(req.params.id), req.user.id, req.body.categorySlug);
        res.json({ success: true, data: report });
    },
    route: async (req, res) => {
        const report = await report_service_1.reportService.routeReport(String(req.params.id), req.body.ngoId, req.user.id);
        res.json({ success: true, data: report });
    },
    markInvalid: async (req, res) => {
        const report = await report_service_1.reportService.markInvalid(String(req.params.id), req.user.id, req.body.reason);
        res.json({ success: true, data: report });
    },
    mergeDuplicate: async (req, res) => {
        const report = await report_service_1.reportService.mergeDuplicate(String(req.params.id), req.user.id, req.body.canonicalReportId);
        res.json({ success: true, data: report });
    },
    escalate: async (req, res) => {
        const report = await report_service_1.reportService.escalate(String(req.params.id), req.user.id, req.body.reason);
        res.json({ success: true, data: report });
    },
};
