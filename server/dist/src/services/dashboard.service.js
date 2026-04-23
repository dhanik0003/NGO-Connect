"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
exports.dashboardService = {
    async getAdminDashboard() {
        const [approvedNgos, activeReports, activeVolunteers, criticalReports, escalations, hotspots,] = await Promise.all([
            prisma_1.prisma.ngo.count({
                where: { verificationStatus: client_1.NgoVerificationStatus.APPROVED },
            }),
            prisma_1.prisma.masterReport.count({
                where: {
                    status: {
                        notIn: [client_1.MasterReportStatus.INVALID, client_1.MasterReportStatus.VERIFIED_CLOSED],
                    },
                },
            }),
            prisma_1.prisma.volunteerProfile.count({
                where: { availabilityStatus: client_1.AvailabilityStatus.AVAILABLE },
            }),
            prisma_1.prisma.masterReport.count({
                where: { priorityLabel: client_1.PriorityLabel.CRITICAL },
            }),
            prisma_1.prisma.escalation.count({
                where: { status: client_1.EscalationStatus.OPEN },
            }),
            prisma_1.prisma.masterReport.findMany({
                take: 12,
                orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
                include: {
                    aiPredictedCategory: true,
                },
            }),
        ]);
        return {
            approvedNgos,
            activeReports,
            activeVolunteers,
            criticalReports,
            escalations,
            hotspots,
        };
    },
    async getSurveyorDashboard(userId) {
        const [surveyor, reports] = await Promise.all([
            prisma_1.prisma.surveyorProfile.findFirst({
                where: { userId },
                include: { ngo: true },
            }),
            prisma_1.prisma.masterReport.findMany({
                where: {
                    reporterUserId: userId,
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);
        return {
            surveyor,
            directCount: reports.filter((report) => report.routedNgoId).length,
            centralQueueCount: reports.filter((report) => !report.routedNgoId).length,
            criticalCount: reports.filter((report) => report.priorityLabel === client_1.PriorityLabel.CRITICAL).length,
            reports,
        };
    },
    async getRoleAwareDashboard(userId, role) {
        if (role === client_1.Role.SUPER_ADMIN) {
            return this.getAdminDashboard();
        }
        if (role === client_1.Role.SURVEYOR) {
            return this.getSurveyorDashboard(userId);
        }
        if (role === client_1.Role.USER) {
            const reports = await prisma_1.prisma.masterReport.findMany({
                where: {
                    reporterUserId: userId,
                },
                orderBy: { createdAt: "desc" },
            });
            return {
                reports,
                openReports: reports.filter((report) => report.status !== client_1.MasterReportStatus.VERIFIED_CLOSED).length,
            };
        }
        if (role === client_1.Role.NGO_ADMIN) {
            const ngo = await prisma_1.prisma.ngo.findFirst({
                where: { createdByUserId: userId },
            });
            if (!ngo) {
                return null;
            }
            const tasks = await prisma_1.prisma.ngoTask.groupBy({
                by: ["status"],
                where: { ngoId: ngo.id },
                _count: { _all: true },
            });
            return { ngo, tasks };
        }
        const volunteer = await prisma_1.prisma.volunteerProfile.findFirst({
            where: { userId },
        });
        if (!volunteer) {
            return null;
        }
        const assignments = await prisma_1.prisma.volunteerAssignment.groupBy({
            by: ["assignmentStatus"],
            where: { volunteerId: volunteer.id },
            _count: { _all: true },
        });
        return { volunteer, assignments, taskStatusReference: client_1.NgoTaskStatus };
    },
};
