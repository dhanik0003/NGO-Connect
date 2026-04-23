"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const report_service_1 = require("../services/report.service");
exports.reportController = {
    create: async (req, res) => {
        const report = await report_service_1.reportService.createCitizenReport({
            actorUserId: req.user.id,
            ...req.body,
            mediaUrl: req.uploadedFileUrl,
            mediaType: req.uploadedFileType,
        });
        res.status(201).json({ success: true, data: report });
    },
    listMine: async (req, res) => {
        const reports = await report_service_1.reportService.getMyReports(req.user.id);
        res.json({ success: true, data: reports });
    },
    getOne: async (req, res) => {
        const report = await report_service_1.reportService.getReportForUser(req.user.id, req.user.role, String(req.params.id));
        res.json({ success: true, data: report });
    },
};
