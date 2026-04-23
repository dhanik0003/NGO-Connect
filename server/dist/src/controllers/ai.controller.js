"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const zod_1 = require("zod");
const ai_service_1 = require("../ai/ai.service");
const report_service_1 = require("../services/report.service");
const prisma_1 = require("../lib/prisma");
const classifySchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    categorySlug: zod_1.z.string().optional(),
});
const prioritySchema = classifySchema;
const reportIdSchema = zod_1.z.object({
    reportId: zod_1.z.string().min(10),
});
const taskIdSchema = zod_1.z.object({
    taskId: zod_1.z.string().min(10),
});
exports.aiController = {
    status: async (_req, res) => {
        res.json({ success: true, data: ai_service_1.aiService.getStatus() });
    },
    classifyDomain: async (req, res) => {
        const input = classifySchema.parse(req.body);
        const data = await ai_service_1.aiService.classifyDomain({
            title: input.title,
            description: input.description,
            selectedCategorySlug: input.categorySlug,
        });
        res.json({ success: true, data });
    },
    scorePriority: async (req, res) => {
        const input = prioritySchema.parse(req.body);
        const data = await ai_service_1.aiService.scorePriority(input);
        res.json({ success: true, data });
    },
    matchNgo: async (req, res) => {
        const { reportId } = reportIdSchema.parse(req.body);
        const data = await report_service_1.reportService.getNgoSuggestions(reportId);
        res.json({ success: true, data });
    },
    matchVolunteer: async (req, res) => {
        const { taskId } = taskIdSchema.parse(req.body);
        const task = await prisma_1.prisma.ngoTask.findUnique({
            where: { id: taskId },
            include: {
                ngo: {
                    include: {
                        volunteers: {
                            include: { user: true },
                        },
                    },
                },
                category: true,
            },
        });
        if (!task) {
            res.status(404).json({ success: false, message: "Task not found." });
            return;
        }
        const data = await ai_service_1.aiService.matchVolunteer({
            latitude: task.latitude,
            longitude: task.longitude,
            title: task.title,
            description: task.description,
            categoryName: task.category?.name,
        }, task.ngo.volunteers.map((volunteer) => ({
            id: volunteer.id,
            fullName: volunteer.user.fullName,
            latitude: volunteer.latitude,
            longitude: volunteer.longitude,
            serviceRadiusKm: volunteer.serviceRadiusKm,
            availabilityStatus: volunteer.availabilityStatus,
            currentWorkload: volunteer.currentWorkload,
            acceptanceRate: volunteer.acceptanceRate,
            rating: volunteer.rating,
            vehicleType: volunteer.vehicleType,
            skills: Array.isArray(volunteer.skillsJson) ? volunteer.skillsJson : [],
        })));
        res.json({ success: true, data });
    },
    checkDuplicate: async (req, res) => {
        const { reportId } = reportIdSchema.parse(req.body);
        const report = await prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
            include: {
                originalCategory: true,
                aiPredictedCategory: true,
            },
        });
        if (!report) {
            res.status(404).json({ success: false, message: "Report not found." });
            return;
        }
        const candidates = await prisma_1.prisma.masterReport.findMany({
            where: {
                id: { not: reportId },
            },
            include: {
                originalCategory: true,
                aiPredictedCategory: true,
            },
            take: 50,
        });
        const data = await ai_service_1.aiService.detectDuplicate({
            id: report.id,
            title: report.title,
            description: report.description,
            latitude: report.latitude,
            longitude: report.longitude,
            categorySlug: report.aiPredictedCategory?.slug ?? report.originalCategory?.slug,
            createdAt: report.createdAt,
        }, candidates.map((candidate) => ({
            id: candidate.id,
            title: candidate.title,
            description: candidate.description,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            categorySlug: candidate.aiPredictedCategory?.slug ?? candidate.originalCategory?.slug,
            createdAt: candidate.createdAt,
        })), {
            radiusKm: 1.5,
            lookbackHours: 72,
        });
        res.json({ success: true, data });
    },
};
