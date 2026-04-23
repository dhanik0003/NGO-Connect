import type { Request, Response } from "express";
import { z } from "zod";
import { aiService } from "../ai/ai.service";
import { reportService } from "../services/report.service";
import { prisma } from "../lib/prisma";

const classifySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categorySlug: z.string().optional(),
});

const prioritySchema = classifySchema;

const reportIdSchema = z.object({
  reportId: z.string().min(10),
});

const taskIdSchema = z.object({
  taskId: z.string().min(10),
});

export const aiController = {
  status: async (_req: Request, res: Response) => {
    res.json({ success: true, data: aiService.getStatus() });
  },

  classifyDomain: async (req: Request, res: Response) => {
    const input = classifySchema.parse(req.body);
    const data = await aiService.classifyDomain({
      title: input.title,
      description: input.description,
      selectedCategorySlug: input.categorySlug,
    });
    res.json({ success: true, data });
  },

  scorePriority: async (req: Request, res: Response) => {
    const input = prioritySchema.parse(req.body);
    const data = await aiService.scorePriority(input);
    res.json({ success: true, data });
  },

  matchNgo: async (req: Request, res: Response) => {
    const { reportId } = reportIdSchema.parse(req.body);
    const data = await reportService.getNgoSuggestions(reportId);
    res.json({ success: true, data });
  },

  matchVolunteer: async (req: Request, res: Response) => {
    const { taskId } = taskIdSchema.parse(req.body);
    const task = await prisma.ngoTask.findUnique({
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

    const data = await aiService.matchVolunteer(
      {
        latitude: task.latitude,
        longitude: task.longitude,
        title: task.title,
        description: task.description,
        categoryName: task.category?.name,
      },
      task.ngo.volunteers.map((volunteer) => ({
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
        skills: Array.isArray(volunteer.skillsJson) ? (volunteer.skillsJson as string[]) : [],
      })),
    );
    res.json({ success: true, data });
  },

  checkDuplicate: async (req: Request, res: Response) => {
    const { reportId } = reportIdSchema.parse(req.body);
    const report = await prisma.masterReport.findUnique({
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

    const candidates = await prisma.masterReport.findMany({
      where: {
        id: { not: reportId },
      },
      include: {
        originalCategory: true,
        aiPredictedCategory: true,
      },
      take: 50,
    });

    const data = await aiService.detectDuplicate(
      {
        id: report.id,
        title: report.title,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        categorySlug: report.aiPredictedCategory?.slug ?? report.originalCategory?.slug,
        createdAt: report.createdAt,
      },
      candidates.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        categorySlug: candidate.aiPredictedCategory?.slug ?? candidate.originalCategory?.slug,
        createdAt: candidate.createdAt,
      })),
      {
        radiusKm: 1.5,
        lookbackHours: 72,
      },
    );

    res.json({ success: true, data });
  },
};
