import {
  AiDecisionType,
  AvailabilityStatus,
  MasterReportStatus,
  NgoVerificationStatus,
  NgoTaskStatus,
  NotificationType,
  PriorityLabel,
  ReporterRole,
  Role,
  SourceChannel,
  SourceType,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import { aiService } from "../ai/ai.service";
import { workflowService } from "./workflow.service";
import { notificationService } from "./notification.service";
import { haversineDistanceKm } from "../utils/distance";

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
} as const;

const getRoutingConfig = async () => {
  const config = await prisma.routingConfig.findFirst();

  return (
    config ?? {
      directSameDomainSameRegion: true,
      allowOutsideRegionException: true,
      uncertainClassificationBelow: 65,
      emergencyPriorityThreshold: 85,
      autoRouteConfidenceThreshold: 72,
      duplicateGeoRadiusKm: 1.5,
      duplicateLookbackHours: 72,
    }
  );
};

const getCategoryBySlug = async (slug?: string | null) => {
  if (!slug) {
    return null;
  }

  return prisma.category.findUnique({
    where: { slug },
  });
};

const createBaseReport = async (payload: {
  title: string;
  description: string;
  reporterUserId: string;
  reporterRole: ReporterRole;
  sourceChannel: SourceChannel;
  sourceNgoId?: string;
  sourceSurveyorId?: string;
  originalCategoryId?: string;
  latitude: number;
  longitude: number;
  address: string;
  mediaUrl?: string;
  mediaType?: string;
  regionalExceptionFlag?: boolean;
}) =>
  prisma.$transaction(async (tx) => {
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

    await workflowService.recordReportStatus(tx, {
      reportId: report.id,
      oldStatus: null,
      newStatus: MasterReportStatus.SUBMITTED,
      changedByUserId: payload.reporterUserId,
      note: "Report created.",
    });

    await workflowService.recordAudit(tx, {
      actorUserId: payload.reporterUserId,
      actorRole:
        payload.reporterRole === ReporterRole.SURVEYOR
          ? Role.SURVEYOR
          : payload.reporterRole === ReporterRole.NGO_ADMIN
            ? Role.NGO_ADMIN
            : payload.reporterRole === ReporterRole.SUPER_ADMIN
              ? Role.SUPER_ADMIN
              : Role.USER,
      action: "report_created",
      entityType: "master_report",
      entityId: report.id,
    });

    return report;
  });

const buildNgoSuggestions = async (
  reportId: string,
  options?: { includeNgoIds?: string[] },
) => {
  const report = await prisma.masterReport.findUnique({
    where: { id: reportId },
    include: {
      originalCategory: true,
      aiPredictedCategory: true,
    },
  });

  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  const categorySlug = report.aiPredictedCategory?.slug ?? report.originalCategory?.slug ?? undefined;

  const ngos = await prisma.ngo.findMany({
    where: {
      OR: [
        {
          verificationStatus: {
            notIn: [NgoVerificationStatus.REJECTED, NgoVerificationStatus.SUSPENDED],
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
              NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
              NgoTaskStatus.ACCEPTED,
              NgoTaskStatus.ASSIGNED,
              NgoTaskStatus.IN_PROGRESS,
              NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
            ],
          },
        },
        select: { id: true },
      },
      volunteers: {
        where: {
          availabilityStatus: AvailabilityStatus.AVAILABLE,
        },
        select: { id: true },
      },
    },
  });

  return aiService.matchNgo(
    {
      latitude: report.latitude,
      longitude: report.longitude,
      categorySlug,
      title: report.title,
      description: report.description,
    },
    ngos.map((ngo) => ({
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
    })),
  );
};

const routeReportInternal = async (
  reportId: string,
  ngoId: string,
  actorUserId: string,
  reason: string,
) => {
  const report = await prisma.masterReport.findUnique({
    where: { id: reportId },
    include: {
      aiPredictedCategory: true,
      originalCategory: true,
      linkedNgoTask: true,
      reporter: true,
    },
  });

  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  const ngo = await prisma.ngo.findUnique({
    where: { id: ngoId },
  });

  if (!ngo) {
    throw new AppError("Target NGO not found.", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    let taskId = report.linkedNgoTaskId ?? undefined;

    if (!taskId) {
      const task = await tx.ngoTask.create({
        data: {
          ngoId,
          sourceType: SourceType.MASTER_REPORT,
          reportedByUserId: report.reporterUserId,
          title: report.title,
          description: report.description,
          categoryId: report.aiPredictedCategoryId ?? report.originalCategoryId,
          priorityLabel: report.priorityLabel,
          priorityScore: report.priorityScore,
          latitude: report.latitude,
          longitude: report.longitude,
          address: report.address,
          status: NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
          masterReport: {
            connect: {
              id: report.id,
            },
          },
        },
      });

      taskId = task.id;

      await workflowService.recordTaskStatus(tx, {
        taskId: task.id,
        oldStatus: null,
        newStatus: NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
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
        status: MasterReportStatus.ROUTED_TO_NGO,
      },
    });

    await workflowService.recordReportStatus(tx, {
      reportId: report.id,
      oldStatus: previousStatus,
      newStatus: MasterReportStatus.ROUTED_TO_NGO,
      changedByUserId: actorUserId,
      note: reason,
    });

    await workflowService.recordAudit(tx, {
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

  await notificationService.create({
    recipientUserId: ngo.createdByUserId,
    role: Role.NGO_ADMIN,
    title: "New routed task",
    body: `${report.title} has been routed to ${ngo.name}.`,
    type: NotificationType.REPORT_ROUTED,
    meta: {
      reportId: report.id,
      taskId: result.taskId,
    },
  });

  return prisma.masterReport.findUniqueOrThrow({
    where: { id: report.id },
    include: reportInclude,
  });
};

const analyzeAndMaybeRoute = async (
  reportId: string,
  actorUserId: string,
  options?: { preferredNgoId?: string; skipAutoRoute?: boolean },
) => {
  const [report, config] = await Promise.all([
    prisma.masterReport.findUnique({
      where: { id: reportId },
      include: {
        originalCategory: true,
      },
    }),
    getRoutingConfig(),
  ]);

  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  const classification = await aiService.classifyDomain({
    title: report.title,
    description: report.description,
    selectedCategorySlug: report.originalCategory?.slug,
  });
  const category = await getCategoryBySlug(classification.predictedSlug);
  const priority = await aiService.scorePriority({
    title: report.title,
    description: report.description,
  });

  const potentialDuplicates = await prisma.masterReport.findMany({
    where: {
      id: { not: report.id },
      status: {
        notIn: [MasterReportStatus.INVALID, MasterReportStatus.VERIFIED_CLOSED, MasterReportStatus.DUPLICATE_MERGED],
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

  const duplicateResult = await aiService.detectDuplicate(
    {
      id: report.id,
      title: report.title,
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      categorySlug: category?.slug ?? report.originalCategory?.slug,
      createdAt: report.createdAt,
    },
    potentialDuplicates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      description: candidate.description,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      categorySlug: candidate.aiPredictedCategory?.slug ?? candidate.originalCategory?.slug,
      createdAt: candidate.createdAt,
    })),
    {
      radiusKm: config.duplicateGeoRadiusKm,
      lookbackHours: config.duplicateLookbackHours,
    },
  );

  await prisma.$transaction(async (tx) => {
    let nextStatus: MasterReportStatus =
      classification.confidence < config.uncertainClassificationBelow
        ? MasterReportStatus.UNDER_REVIEW
        : MasterReportStatus.CLASSIFIED;

    let duplicateGroupId: string | undefined;

    if (duplicateResult.isDuplicate && duplicateResult.matchedReportId) {
      const matchedReport = await tx.masterReport.findUnique({
        where: { id: duplicateResult.matchedReportId },
        select: {
          duplicateGroupId: true,
        },
      });

      if (matchedReport?.duplicateGroupId) {
        duplicateGroupId = matchedReport.duplicateGroupId;
      } else {
        const group = await tx.duplicateGroup.create({
          data: {
            canonicalReportId: duplicateResult.matchedReportId,
          },
        });
        duplicateGroupId = group.id;
      }

      nextStatus = MasterReportStatus.DUPLICATE_FLAGGED;
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

    await workflowService.recordReportStatus(tx, {
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
          decisionType: AiDecisionType.DOMAIN_CLASSIFICATION,
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
          decisionType: AiDecisionType.PRIORITY_SCORING,
          inputPayloadJson: {
            title: report.title,
            description: report.description,
          },
          outputPayloadJson: priority,
          confidenceScore: priority.score,
        },
        {
          reportId: report.id,
          decisionType: AiDecisionType.DUPLICATE_CHECK,
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
    return prisma.masterReport.findUniqueOrThrow({
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

  await prisma.aiDecision.create({
    data: {
      reportId: report.id,
      decisionType: AiDecisionType.NGO_MATCH,
      inputPayloadJson: {
        preferredNgoId: options?.preferredNgoId ?? null,
      },
      outputPayloadJson: ngoSuggestions,
      confidenceScore: ngoSuggestions[0]?.score ?? 0,
    },
  });

  if (options?.skipAutoRoute) {
    return prisma.masterReport.findUniqueOrThrow({
      where: { id: report.id },
      include: reportInclude,
    });
  }

  if (
    classification.confidence >= config.autoRouteConfidenceThreshold &&
    bestNgo
  ) {
    return routeReportInternal(
      report.id,
      bestNgo.ngoId,
      actorUserId,
      options?.preferredNgoId
        ? "Directly routed from configured surveyor workflow."
        : "Auto-routed after AI classification and NGO match scoring.",
    );
  }

  return prisma.masterReport.findUniqueOrThrow({
    where: { id: report.id },
    include: reportInclude,
  });
};

export const reportService = {
  async createCitizenReport(input: {
    actorUserId: string;
    title: string;
    description: string;
    categorySlug?: string;
    latitude: number;
    longitude: number;
    address: string;
    mediaUrl?: string;
    mediaType?: string;
  }) {
    const category = await getCategoryBySlug(input.categorySlug);
    const report = await createBaseReport({
      title: input.title,
      description: input.description,
      reporterUserId: input.actorUserId,
      reporterRole: ReporterRole.USER,
      sourceChannel: SourceChannel.USER_APP,
      originalCategoryId: category?.id,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
    });

    await notificationService.create({
      recipientUserId: input.actorUserId,
      role: Role.USER,
      title: "Issue submitted",
      body: "Your issue has been submitted and entered the routing pipeline.",
      type: NotificationType.REPORT_CREATED,
      meta: {
        reportId: report.id,
      },
    });

    return analyzeAndMaybeRoute(report.id, input.actorUserId);
  },

  async createSurveyorReport(input: {
    actorUserId: string;
    title: string;
    description: string;
    categorySlug?: string;
    categoryConfidence?: number;
    latitude: number;
    longitude: number;
    address: string;
    isEmergency?: boolean;
    preferredRoute?: "ngo" | "central";
    mediaUrl?: string;
    mediaType?: string;
  }) {
    const surveyor = await prisma.surveyorProfile.findFirst({
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
      throw new AppError("Surveyor profile not found.", 404);
    }

    const category = await getCategoryBySlug(input.categorySlug);
    const sameDomain = Boolean(
      category && surveyor.ngo.domains.some((domain) => domain.category.slug === category.slug),
    );
    const distanceFromRegion = haversineDistanceKm(
      { latitude: input.latitude, longitude: input.longitude },
      { latitude: surveyor.latitude, longitude: surveyor.longitude },
    );
    const withinRegion = distanceFromRegion <= surveyor.serviceRadiusKm;
    const config = await getRoutingConfig();
    const categoryConfidence = input.categoryConfidence ?? (input.categorySlug ? 85 : 40);
    const regionalExceptionFlag = sameDomain && !withinRegion && config.allowOutsideRegionException;
    const directToNgo =
      sameDomain &&
      (withinRegion || regionalExceptionFlag) &&
      categoryConfidence >= config.uncertainClassificationBelow;
    const skipAutoRoute =
      input.preferredRoute === "central" ||
      (input.preferredRoute === "ngo" && !directToNgo);

    const report = await createBaseReport({
      title: input.title,
      description: input.description,
      reporterUserId: input.actorUserId,
      reporterRole: ReporterRole.SURVEYOR,
      sourceChannel: SourceChannel.SURVEYOR_APP,
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
      preferredNgoId:
        input.preferredRoute === "ngo" && directToNgo ? surveyor.ngoId : undefined,
      skipAutoRoute,
    });

    if (input.isEmergency && surveyor.ngo.createdByUserId) {
      await notificationService.create({
        recipientUserId: surveyor.ngo.createdByUserId,
        role: Role.NGO_ADMIN,
        title: "Emergency field report received",
        body: `${input.title} was flagged as emergency by a surveyor.`,
        type: NotificationType.GENERAL,
        meta: {
          reportId: report.id,
        },
      });
    }

    return routedReport;
  },

  async getMyReports(userId: string) {
    return prisma.masterReport.findMany({
      where: {
        reporterUserId: userId,
      },
      include: reportInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  async getReportForUser(userId: string, role: Role, reportId: string) {
    const report = await prisma.masterReport.findUnique({
      where: { id: reportId },
      include: reportInclude,
    });

    if (!report) {
      throw new AppError("Report not found.", 404);
    }

    const ngoAdminNgo = role === Role.NGO_ADMIN
      ? await prisma.ngo.findFirst({
          where: { createdByUserId: userId },
          select: { id: true },
        })
      : null;

    const canAccess =
      role === Role.SUPER_ADMIN ||
      report.reporterUserId === userId ||
      (role === Role.NGO_ADMIN && report.routedNgoId === ngoAdminNgo?.id);

    if (!canAccess) {
      throw new AppError("You do not have access to this report.", 403);
    }

    return report;
  },

  async listAdminReports(filters: { status?: MasterReportStatus; priorityLabel?: PriorityLabel }) {
    return prisma.masterReport.findMany({
      where: {
        status: filters.status,
        priorityLabel: filters.priorityLabel,
      },
      include: reportInclude,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    });
  },

  async classifyReport(reportId: string, actorUserId: string, categorySlug?: string) {
    const report = await prisma.masterReport.findUnique({
      where: { id: reportId },
      include: { originalCategory: true },
    });

    if (!report) {
      throw new AppError("Report not found.", 404);
    }

    const category = await getCategoryBySlug(categorySlug);
    const classification = category
      ? {
          predictedSlug: category.slug,
          predictedName: category.name,
          confidence: 95,
          reasoning: "Manually overridden by admin.",
        }
        : await aiService.classifyDomain({
          title: report.title,
          description: report.description,
          selectedCategorySlug: report.originalCategory?.slug,
        });
    const predictedCategory = category ?? (await getCategoryBySlug(classification.predictedSlug));
    const priority = await aiService.scorePriority({ title: report.title, description: report.description });

    await prisma.$transaction(async (tx) => {
      await tx.masterReport.update({
        where: { id: reportId },
        data: {
          aiPredictedCategoryId: predictedCategory?.id,
          aiConfidence: classification.confidence,
          aiReasoning: classification.reasoning,
          priorityScore: priority.score,
          priorityLabel: priority.label,
          status: MasterReportStatus.CLASSIFIED,
        },
      });

      await workflowService.recordReportStatus(tx, {
        reportId,
        oldStatus: report.status,
        newStatus: MasterReportStatus.CLASSIFIED,
        changedByUserId: actorUserId,
        note: classification.reasoning,
      });
    });

    return prisma.masterReport.findUniqueOrThrow({
      where: { id: reportId },
      include: reportInclude,
    });
  },

  async routeReport(reportId: string, ngoId: string, actorUserId: string) {
    return routeReportInternal(reportId, ngoId, actorUserId, "Manually routed by super admin.");
  },

  async markInvalid(reportId: string, actorUserId: string, reason: string) {
    const report = await prisma.masterReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError("Report not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.masterReport.update({
        where: { id: reportId },
        data: {
          status: MasterReportStatus.INVALID,
        },
      });

      await workflowService.recordReportStatus(tx, {
        reportId,
        oldStatus: report.status,
        newStatus: MasterReportStatus.INVALID,
        changedByUserId: actorUserId,
        note: reason,
      });
    });

    return prisma.masterReport.findUniqueOrThrow({
      where: { id: reportId },
      include: reportInclude,
    });
  },

  async mergeDuplicate(reportId: string, actorUserId: string, canonicalReportId: string) {
    const [report, canonical] = await Promise.all([
      prisma.masterReport.findUnique({ where: { id: reportId } }),
      prisma.masterReport.findUnique({ where: { id: canonicalReportId } }),
    ]);

    if (!report || !canonical) {
      throw new AppError("Report not found.", 404);
    }

    const duplicateGroupId = canonical.duplicateGroupId ?? (
      await prisma.duplicateGroup.create({
        data: {
          canonicalReportId,
        },
      })
    ).id;

    await prisma.$transaction(async (tx) => {
      await tx.masterReport.update({
        where: { id: reportId },
        data: {
          duplicateGroupId,
          status: MasterReportStatus.DUPLICATE_MERGED,
        },
      });

      await workflowService.recordReportStatus(tx, {
        reportId,
        oldStatus: report.status,
        newStatus: MasterReportStatus.DUPLICATE_MERGED,
        changedByUserId: actorUserId,
        note: `Merged into canonical report ${canonicalReportId}.`,
      });
    });

    return prisma.masterReport.findUniqueOrThrow({
      where: { id: reportId },
      include: reportInclude,
    });
  },

  async escalate(reportId: string, actorUserId: string, reason: string) {
    const report = await prisma.masterReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError("Report not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.masterReport.update({
        where: { id: reportId },
        data: {
          escalationFlag: true,
          status: MasterReportStatus.ESCALATED,
        },
      });

      await tx.escalation.create({
        data: {
          reportId,
          raisedByUserId: actorUserId,
          reason,
        },
      });

      await workflowService.recordReportStatus(tx, {
        reportId,
        oldStatus: report.status,
        newStatus: MasterReportStatus.ESCALATED,
        changedByUserId: actorUserId,
        note: reason,
      });
    });

    return prisma.masterReport.findUniqueOrThrow({
      where: { id: reportId },
      include: reportInclude,
    });
  },

  async getNgoSuggestions(reportId: string) {
    return buildNgoSuggestions(reportId);
  },
};
