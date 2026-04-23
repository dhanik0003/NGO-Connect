"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const app_error_1 = require("../utils/app-error");
const ai_service_1 = require("../ai/ai.service");
const workflow_service_1 = require("./workflow.service");
const notification_service_1 = require("./notification.service");
const distance_1 = require("../utils/distance");
const reportInclude = {
    originalCategory: true,
    aiPredictedCategory: true,
    routedNgo: true,
    linkedNgoTask: {
        include: {
            assignedVolunteer: {
                include: {
                    user: true,
                },
            },
            evidence: true,
        },
    },
    statusHistory: {
        orderBy: { createdAt: "asc" },
    },
    escalations: true,
};
const getRoutingConfig = async () => {
    const config = await prisma_1.prisma.routingConfig.findFirst();
    return (config ?? {
        directSameDomainSameRegion: true,
        allowOutsideRegionException: true,
        uncertainClassificationBelow: 65,
        emergencyPriorityThreshold: 85,
        autoRouteConfidenceThreshold: 72,
        duplicateGeoRadiusKm: 1.5,
        duplicateLookbackHours: 72,
    });
};
const getCategoryBySlug = async (slug) => {
    if (!slug) {
        return null;
    }
    return prisma_1.prisma.category.findUnique({
        where: { slug },
    });
};
const createBaseReport = async (payload) => prisma_1.prisma.$transaction(async (tx) => {
    const report = await tx.masterReport.create({
        data: {
            title: payload.title,
            description: payload.description,
            reporterUserId: payload.reporterUserId,
            reporterRole: payload.reporterRole,
            sourceChannel: payload.sourceChannel,
            sourceNgoId: payload.sourceNgoId,
            sourceSurveyorId: payload.sourceSurveyorId,
            originalCategoryId: payload.originalCategoryId,
            latitude: payload.latitude,
            longitude: payload.longitude,
            address: payload.address,
            mediaUrl: payload.mediaUrl,
            mediaType: payload.mediaType,
            regionalExceptionFlag: payload.regionalExceptionFlag ?? false,
        },
    });
    await workflow_service_1.workflowService.recordReportStatus(tx, {
        reportId: report.id,
        oldStatus: null,
        newStatus: client_1.MasterReportStatus.SUBMITTED,
        changedByUserId: payload.reporterUserId,
        note: "Report created.",
    });
    await workflow_service_1.workflowService.recordAudit(tx, {
        actorUserId: payload.reporterUserId,
        actorRole: payload.reporterRole === client_1.ReporterRole.SURVEYOR
            ? client_1.Role.SURVEYOR
            : payload.reporterRole === client_1.ReporterRole.NGO_ADMIN
                ? client_1.Role.NGO_ADMIN
                : payload.reporterRole === client_1.ReporterRole.SUPER_ADMIN
                    ? client_1.Role.SUPER_ADMIN
                    : client_1.Role.USER,
        action: "report_created",
        entityType: "master_report",
        entityId: report.id,
    });
    return report;
});
const buildNgoSuggestions = async (reportId, options) => {
    const report = await prisma_1.prisma.masterReport.findUnique({
        where: { id: reportId },
        include: {
            originalCategory: true,
            aiPredictedCategory: true,
        },
    });
    if (!report) {
        throw new app_error_1.AppError("Report not found.", 404);
    }
    const categorySlug = report.aiPredictedCategory?.slug ?? report.originalCategory?.slug ?? undefined;
    const ngos = await prisma_1.prisma.ngo.findMany({
        where: {
            OR: [
                {
                    verificationStatus: {
                        notIn: [client_1.NgoVerificationStatus.REJECTED, client_1.NgoVerificationStatus.SUSPENDED],
                    },
                },
                ...(options?.includeNgoIds?.length
                    ? [
                        {
                            id: {
                                in: options.includeNgoIds,
                            },
                        },
                    ]
                    : []),
            ],
            domains: categorySlug
                ? {
                    some: {
                        category: {
                            slug: categorySlug,
                        },
                    },
                }
                : undefined,
        },
        include: {
            domains: {
                include: { category: true },
            },
            regions: true,
            tasks: {
                where: {
                    status: {
                        in: [
                            client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                            client_1.NgoTaskStatus.ACCEPTED,
                            client_1.NgoTaskStatus.ASSIGNED,
                            client_1.NgoTaskStatus.IN_PROGRESS,
                            client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
                        ],
                    },
                },
                select: { id: true },
            },
            volunteers: {
                where: {
                    availabilityStatus: client_1.AvailabilityStatus.AVAILABLE,
                },
                select: { id: true },
            },
        },
    });
    return ai_service_1.aiService.matchNgo({
        latitude: report.latitude,
        longitude: report.longitude,
        categorySlug,
        title: report.title,
        description: report.description,
    }, ngos.map((ngo) => ({
        id: ngo.id,
        name: ngo.name,
        latitude: ngo.latitude,
        longitude: ngo.longitude,
        serviceRadiusKm: ngo.serviceRadiusKm,
        verificationStatus: ngo.verificationStatus,
        supportedCategorySlugs: ngo.domains.map((domain) => domain.category.slug),
        regions: ngo.regions.map((region) => ({
            latitude: region.latitude,
            longitude: region.longitude,
            coverageRadiusKm: region.coverageRadiusKm,
        })),
        pendingTaskCount: ngo.tasks.length,
        availableVolunteerCount: ngo.volunteers.length,
    })));
};
const routeReportInternal = async (reportId, ngoId, actorUserId, reason) => {
    const report = await prisma_1.prisma.masterReport.findUnique({
        where: { id: reportId },
        include: {
            aiPredictedCategory: true,
            originalCategory: true,
            linkedNgoTask: true,
            reporter: true,
        },
    });
    if (!report) {
        throw new app_error_1.AppError("Report not found.", 404);
    }
    const ngo = await prisma_1.prisma.ngo.findUnique({
        where: { id: ngoId },
    });
    if (!ngo) {
        throw new app_error_1.AppError("Target NGO not found.", 404);
    }
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        let taskId = report.linkedNgoTaskId ?? undefined;
        if (!taskId) {
            const task = await tx.ngoTask.create({
                data: {
                    ngoId,
                    sourceType: client_1.SourceType.MASTER_REPORT,
                    reportedByUserId: report.reporterUserId,
                    title: report.title,
                    description: report.description,
                    categoryId: report.aiPredictedCategoryId ?? report.originalCategoryId,
                    priorityLabel: report.priorityLabel,
                    priorityScore: report.priorityScore,
                    latitude: report.latitude,
                    longitude: report.longitude,
                    address: report.address,
                    status: client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                    masterReport: {
                        connect: {
                            id: report.id,
                        },
                    },
                },
            });
            taskId = task.id;
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId: task.id,
                oldStatus: null,
                newStatus: client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                changedByUserId: actorUserId,
                note: "Task created from routed master report.",
            });
        }
        const previousStatus = report.status;
        await tx.masterReport.update({
            where: { id: report.id },
            data: {
                routedNgoId: ngoId,
                linkedNgoTaskId: taskId,
                status: client_1.MasterReportStatus.ROUTED_TO_NGO,
            },
        });
        await workflow_service_1.workflowService.recordReportStatus(tx, {
            reportId: report.id,
            oldStatus: previousStatus,
            newStatus: client_1.MasterReportStatus.ROUTED_TO_NGO,
            changedByUserId: actorUserId,
            note: reason,
        });
        await workflow_service_1.workflowService.recordAudit(tx, {
            actorUserId,
            action: "report_routed",
            entityType: "master_report",
            entityId: report.id,
            metadata: {
                ngoId,
                linkedNgoTaskId: taskId,
            },
        });
        return { taskId };
    });
    await notification_service_1.notificationService.create({
        recipientUserId: ngo.createdByUserId,
        role: client_1.Role.NGO_ADMIN,
        title: "New routed task",
        body: `${report.title} has been routed to ${ngo.name}.`,
        type: client_1.NotificationType.REPORT_ROUTED,
        meta: {
            reportId: report.id,
            taskId: result.taskId,
        },
    });
    return prisma_1.prisma.masterReport.findUniqueOrThrow({
        where: { id: report.id },
        include: reportInclude,
    });
};
const analyzeAndMaybeRoute = async (reportId, actorUserId, options) => {
    const [report, config] = await Promise.all([
        prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
            include: {
                originalCategory: true,
            },
        }),
        getRoutingConfig(),
    ]);
    if (!report) {
        throw new app_error_1.AppError("Report not found.", 404);
    }
    const classification = await ai_service_1.aiService.classifyDomain({
        title: report.title,
        description: report.description,
        selectedCategorySlug: report.originalCategory?.slug,
    });
    const category = await getCategoryBySlug(classification.predictedSlug);
    const priority = await ai_service_1.aiService.scorePriority({
        title: report.title,
        description: report.description,
    });
    const potentialDuplicates = await prisma_1.prisma.masterReport.findMany({
        where: {
            id: { not: report.id },
            status: {
                notIn: [client_1.MasterReportStatus.INVALID, client_1.MasterReportStatus.VERIFIED_CLOSED, client_1.MasterReportStatus.DUPLICATE_MERGED],
            },
            createdAt: {
                gte: new Date(Date.now() - config.duplicateLookbackHours * 60 * 60 * 1000),
            },
        },
        include: {
            originalCategory: true,
            aiPredictedCategory: true,
        },
        take: 100,
    });
    const duplicateResult = await ai_service_1.aiService.detectDuplicate({
        id: report.id,
        title: report.title,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        categorySlug: category?.slug ?? report.originalCategory?.slug,
        createdAt: report.createdAt,
    }, potentialDuplicates.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        categorySlug: candidate.aiPredictedCategory?.slug ?? candidate.originalCategory?.slug,
        createdAt: candidate.createdAt,
    })), {
        radiusKm: config.duplicateGeoRadiusKm,
        lookbackHours: config.duplicateLookbackHours,
    });
    await prisma_1.prisma.$transaction(async (tx) => {
        let nextStatus = classification.confidence < config.uncertainClassificationBelow
            ? client_1.MasterReportStatus.UNDER_REVIEW
            : client_1.MasterReportStatus.CLASSIFIED;
        let duplicateGroupId;
        if (duplicateResult.isDuplicate && duplicateResult.matchedReportId) {
            const matchedReport = await tx.masterReport.findUnique({
                where: { id: duplicateResult.matchedReportId },
                select: {
                    duplicateGroupId: true,
                },
            });
            if (matchedReport?.duplicateGroupId) {
                duplicateGroupId = matchedReport.duplicateGroupId;
            }
            else {
                const group = await tx.duplicateGroup.create({
                    data: {
                        canonicalReportId: duplicateResult.matchedReportId,
                    },
                });
                duplicateGroupId = group.id;
            }
            nextStatus = client_1.MasterReportStatus.DUPLICATE_FLAGGED;
        }
        await tx.masterReport.update({
            where: { id: report.id },
            data: {
                aiPredictedCategoryId: category?.id,
                aiConfidence: classification.confidence,
                aiReasoning: classification.reasoning,
                priorityScore: priority.score,
                priorityLabel: priority.label,
                duplicateGroupId,
                status: nextStatus,
            },
        });
        await workflow_service_1.workflowService.recordReportStatus(tx, {
            reportId: report.id,
            oldStatus: report.status,
            newStatus: nextStatus,
            changedByUserId: actorUserId,
            note: duplicateResult.isDuplicate ? duplicateResult.reasoning : classification.reasoning,
        });
        await tx.aiDecision.createMany({
            data: [
                {
                    reportId: report.id,
                    decisionType: client_1.AiDecisionType.DOMAIN_CLASSIFICATION,
                    inputPayloadJson: {
                        title: report.title,
                        description: report.description,
                        selectedCategorySlug: report.originalCategory?.slug,
                    },
                    outputPayloadJson: classification,
                    confidenceScore: classification.confidence,
                },
                {
                    reportId: report.id,
                    decisionType: client_1.AiDecisionType.PRIORITY_SCORING,
                    inputPayloadJson: {
                        title: report.title,
                        description: report.description,
                    },
                    outputPayloadJson: priority,
                    confidenceScore: priority.score,
                },
                {
                    reportId: report.id,
                    decisionType: client_1.AiDecisionType.DUPLICATE_CHECK,
                    inputPayloadJson: {
                        duplicateLookbackHours: config.duplicateLookbackHours,
                        duplicateGeoRadiusKm: config.duplicateGeoRadiusKm,
                    },
                    outputPayloadJson: duplicateResult,
                    confidenceScore: duplicateResult.confidence,
                },
            ],
        });
    });
    if (duplicateResult.isDuplicate) {
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: report.id },
            include: reportInclude,
        });
    }
    const ngoSuggestions = await buildNgoSuggestions(report.id, {
        includeNgoIds: options?.preferredNgoId ? [options.preferredNgoId] : undefined,
    });
    const bestNgo = options?.preferredNgoId
        ? ngoSuggestions.find((candidate) => candidate.ngoId === options.preferredNgoId) ?? null
        : ngoSuggestions[0] ?? null;
    await prisma_1.prisma.aiDecision.create({
        data: {
            reportId: report.id,
            decisionType: client_1.AiDecisionType.NGO_MATCH,
            inputPayloadJson: {
                preferredNgoId: options?.preferredNgoId ?? null,
            },
            outputPayloadJson: ngoSuggestions,
            confidenceScore: ngoSuggestions[0]?.score ?? 0,
        },
    });
    if (options?.skipAutoRoute) {
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: report.id },
            include: reportInclude,
        });
    }
    if (classification.confidence >= config.autoRouteConfidenceThreshold &&
        bestNgo) {
        return routeReportInternal(report.id, bestNgo.ngoId, actorUserId, options?.preferredNgoId
            ? "Directly routed from configured surveyor workflow."
            : "Auto-routed after AI classification and NGO match scoring.");
    }
    return prisma_1.prisma.masterReport.findUniqueOrThrow({
        where: { id: report.id },
        include: reportInclude,
    });
};
exports.reportService = {
    async createCitizenReport(input) {
        const category = await getCategoryBySlug(input.categorySlug);
        const report = await createBaseReport({
            title: input.title,
            description: input.description,
            reporterUserId: input.actorUserId,
            reporterRole: client_1.ReporterRole.USER,
            sourceChannel: client_1.SourceChannel.USER_APP,
            originalCategoryId: category?.id,
            latitude: input.latitude,
            longitude: input.longitude,
            address: input.address,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
        });
        await notification_service_1.notificationService.create({
            recipientUserId: input.actorUserId,
            role: client_1.Role.USER,
            title: "Issue submitted",
            body: "Your issue has been submitted and entered the routing pipeline.",
            type: client_1.NotificationType.REPORT_CREATED,
            meta: {
                reportId: report.id,
            },
        });
        return analyzeAndMaybeRoute(report.id, input.actorUserId);
    },
    async createSurveyorReport(input) {
        const surveyor = await prisma_1.prisma.surveyorProfile.findFirst({
            where: { userId: input.actorUserId },
            include: {
                ngo: {
                    include: {
                        domains: {
                            include: { category: true },
                        },
                    },
                },
            },
        });
        if (!surveyor) {
            throw new app_error_1.AppError("Surveyor profile not found.", 404);
        }
        const category = await getCategoryBySlug(input.categorySlug);
        const sameDomain = Boolean(category && surveyor.ngo.domains.some((domain) => domain.category.slug === category.slug));
        const distanceFromRegion = (0, distance_1.haversineDistanceKm)({ latitude: input.latitude, longitude: input.longitude }, { latitude: surveyor.latitude, longitude: surveyor.longitude });
        const withinRegion = distanceFromRegion <= surveyor.serviceRadiusKm;
        const config = await getRoutingConfig();
        const categoryConfidence = input.categoryConfidence ?? (input.categorySlug ? 85 : 40);
        const regionalExceptionFlag = sameDomain && !withinRegion && config.allowOutsideRegionException;
        const directToNgo = sameDomain &&
            (withinRegion || regionalExceptionFlag) &&
            categoryConfidence >= config.uncertainClassificationBelow;
        const skipAutoRoute = input.preferredRoute === "central" ||
            (input.preferredRoute === "ngo" && !directToNgo);
        const report = await createBaseReport({
            title: input.title,
            description: input.description,
            reporterUserId: input.actorUserId,
            reporterRole: client_1.ReporterRole.SURVEYOR,
            sourceChannel: client_1.SourceChannel.SURVEYOR_APP,
            sourceNgoId: surveyor.ngoId,
            sourceSurveyorId: surveyor.id,
            originalCategoryId: category?.id,
            latitude: input.latitude,
            longitude: input.longitude,
            address: input.address,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            regionalExceptionFlag,
        });
        const routedReport = await analyzeAndMaybeRoute(report.id, input.actorUserId, {
            preferredNgoId: input.preferredRoute === "ngo" && directToNgo ? surveyor.ngoId : undefined,
            skipAutoRoute,
        });
        if (input.isEmergency && surveyor.ngo.createdByUserId) {
            await notification_service_1.notificationService.create({
                recipientUserId: surveyor.ngo.createdByUserId,
                role: client_1.Role.NGO_ADMIN,
                title: "Emergency field report received",
                body: `${input.title} was flagged as emergency by a surveyor.`,
                type: client_1.NotificationType.GENERAL,
                meta: {
                    reportId: report.id,
                },
            });
        }
        return routedReport;
    },
    async getMyReports(userId) {
        return prisma_1.prisma.masterReport.findMany({
            where: {
                reporterUserId: userId,
            },
            include: reportInclude,
            orderBy: { createdAt: "desc" },
        });
    },
    async getReportForUser(userId, role, reportId) {
        const report = await prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
            include: reportInclude,
        });
        if (!report) {
            throw new app_error_1.AppError("Report not found.", 404);
        }
        const ngoAdminNgo = role === client_1.Role.NGO_ADMIN
            ? await prisma_1.prisma.ngo.findFirst({
                where: { createdByUserId: userId },
                select: { id: true },
            })
            : null;
        const canAccess = role === client_1.Role.SUPER_ADMIN ||
            report.reporterUserId === userId ||
            (role === client_1.Role.NGO_ADMIN && report.routedNgoId === ngoAdminNgo?.id);
        if (!canAccess) {
            throw new app_error_1.AppError("You do not have access to this report.", 403);
        }
        return report;
    },
    async listAdminReports(filters) {
        return prisma_1.prisma.masterReport.findMany({
            where: {
                status: filters.status,
                priorityLabel: filters.priorityLabel,
            },
            include: reportInclude,
            orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
        });
    },
    async classifyReport(reportId, actorUserId, categorySlug) {
        const report = await prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
            include: { originalCategory: true },
        });
        if (!report) {
            throw new app_error_1.AppError("Report not found.", 404);
        }
        const category = await getCategoryBySlug(categorySlug);
        const classification = category
            ? {
                predictedSlug: category.slug,
                predictedName: category.name,
                confidence: 95,
                reasoning: "Manually overridden by admin.",
            }
            : await ai_service_1.aiService.classifyDomain({
                title: report.title,
                description: report.description,
                selectedCategorySlug: report.originalCategory?.slug,
            });
        const predictedCategory = category ?? (await getCategoryBySlug(classification.predictedSlug));
        const priority = await ai_service_1.aiService.scorePriority({ title: report.title, description: report.description });
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.masterReport.update({
                where: { id: reportId },
                data: {
                    aiPredictedCategoryId: predictedCategory?.id,
                    aiConfidence: classification.confidence,
                    aiReasoning: classification.reasoning,
                    priorityScore: priority.score,
                    priorityLabel: priority.label,
                    status: client_1.MasterReportStatus.CLASSIFIED,
                },
            });
            await workflow_service_1.workflowService.recordReportStatus(tx, {
                reportId,
                oldStatus: report.status,
                newStatus: client_1.MasterReportStatus.CLASSIFIED,
                changedByUserId: actorUserId,
                note: classification.reasoning,
            });
        });
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: reportId },
            include: reportInclude,
        });
    },
    async routeReport(reportId, ngoId, actorUserId) {
        return routeReportInternal(reportId, ngoId, actorUserId, "Manually routed by super admin.");
    },
    async markInvalid(reportId, actorUserId, reason) {
        const report = await prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new app_error_1.AppError("Report not found.", 404);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.masterReport.update({
                where: { id: reportId },
                data: {
                    status: client_1.MasterReportStatus.INVALID,
                },
            });
            await workflow_service_1.workflowService.recordReportStatus(tx, {
                reportId,
                oldStatus: report.status,
                newStatus: client_1.MasterReportStatus.INVALID,
                changedByUserId: actorUserId,
                note: reason,
            });
        });
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: reportId },
            include: reportInclude,
        });
    },
    async mergeDuplicate(reportId, actorUserId, canonicalReportId) {
        const [report, canonical] = await Promise.all([
            prisma_1.prisma.masterReport.findUnique({ where: { id: reportId } }),
            prisma_1.prisma.masterReport.findUnique({ where: { id: canonicalReportId } }),
        ]);
        if (!report || !canonical) {
            throw new app_error_1.AppError("Report not found.", 404);
        }
        const duplicateGroupId = canonical.duplicateGroupId ?? (await prisma_1.prisma.duplicateGroup.create({
            data: {
                canonicalReportId,
            },
        })).id;
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.masterReport.update({
                where: { id: reportId },
                data: {
                    duplicateGroupId,
                    status: client_1.MasterReportStatus.DUPLICATE_MERGED,
                },
            });
            await workflow_service_1.workflowService.recordReportStatus(tx, {
                reportId,
                oldStatus: report.status,
                newStatus: client_1.MasterReportStatus.DUPLICATE_MERGED,
                changedByUserId: actorUserId,
                note: `Merged into canonical report ${canonicalReportId}.`,
            });
        });
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: reportId },
            include: reportInclude,
        });
    },
    async escalate(reportId, actorUserId, reason) {
        const report = await prisma_1.prisma.masterReport.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new app_error_1.AppError("Report not found.", 404);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.masterReport.update({
                where: { id: reportId },
                data: {
                    escalationFlag: true,
                    status: client_1.MasterReportStatus.ESCALATED,
                },
            });
            await tx.escalation.create({
                data: {
                    reportId,
                    raisedByUserId: actorUserId,
                    reason,
                },
            });
            await workflow_service_1.workflowService.recordReportStatus(tx, {
                reportId,
                oldStatus: report.status,
                newStatus: client_1.MasterReportStatus.ESCALATED,
                changedByUserId: actorUserId,
                note: reason,
            });
        });
        return prisma_1.prisma.masterReport.findUniqueOrThrow({
            where: { id: reportId },
            include: reportInclude,
        });
    },
    async getNgoSuggestions(reportId) {
        return buildNgoSuggestions(reportId);
    },
};
