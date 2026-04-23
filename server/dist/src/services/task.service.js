"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const app_error_1 = require("../utils/app-error");
const ai_service_1 = require("../ai/ai.service");
const workflow_service_1 = require("./workflow.service");
const notification_service_1 = require("./notification.service");
const taskInclude = {
    ngo: true,
    category: true,
    assignedVolunteer: {
        include: {
            user: true,
        },
    },
    assignments: {
        include: {
            volunteer: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: { assignedAt: "desc" },
    },
    evidence: {
        include: {
            volunteer: {
                include: {
                    user: true,
                },
            },
            reviewedByUser: true,
        },
        orderBy: { uploadedAt: "desc" },
    },
    statusHistory: {
        orderBy: { createdAt: "asc" },
    },
    masterReport: true,
};
const getNgoAdminNgo = async (userId) => {
    const ngo = await prisma_1.prisma.ngo.findFirst({
        where: { createdByUserId: userId },
        include: {
            domains: {
                include: {
                    category: true,
                },
            },
            volunteers: {
                include: {
                    user: true,
                },
            },
            surveyors: {
                include: {
                    user: true,
                },
            },
        },
    });
    if (!ngo) {
        throw new app_error_1.AppError("NGO admin workspace not found.", 404);
    }
    return ngo;
};
const getVolunteerProfile = async (userId) => {
    const volunteer = await prisma_1.prisma.volunteerProfile.findFirst({
        where: { userId },
        include: {
            user: true,
            ngo: true,
        },
    });
    if (!volunteer) {
        throw new app_error_1.AppError("Volunteer profile not found.", 404);
    }
    return volunteer;
};
const updateLinkedReportStatus = async (tx, taskId, newStatus, changedByUserId, note) => {
    const task = await tx.ngoTask.findUnique({
        where: { id: taskId },
        include: {
            masterReport: true,
        },
    });
    if (!task?.masterReport) {
        return;
    }
    await tx.masterReport.update({
        where: { id: task.masterReport.id },
        data: {
            status: newStatus,
        },
    });
    await workflow_service_1.workflowService.recordReportStatus(tx, {
        reportId: task.masterReport.id,
        oldStatus: task.masterReport.status,
        newStatus,
        changedByUserId,
        note,
    });
};
exports.taskService = {
    async listNgoTasks(userId) {
        const ngo = await getNgoAdminNgo(userId);
        return prisma_1.prisma.ngoTask.findMany({
            where: { ngoId: ngo.id },
            include: taskInclude,
            orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
        });
    },
    async getNgoTask(userId, taskId) {
        const ngo = await getNgoAdminNgo(userId);
        const task = await prisma_1.prisma.ngoTask.findFirst({
            where: {
                id: taskId,
                ngoId: ngo.id,
            },
            include: taskInclude,
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found.", 404);
        }
        return task;
    },
    async acceptTask(userId, taskId) {
        const task = await this.getNgoTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    status: client_1.NgoTaskStatus.ACCEPTED,
                    ngoDecision: client_1.NgoDecision.ACCEPTED,
                    acceptedAt: new Date(),
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.ACCEPTED,
                changedByUserId: userId,
                note: "NGO accepted the routed task.",
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.ACCEPTED_BY_NGO, userId, "NGO accepted the routed task.");
        });
        return this.getNgoTask(userId, taskId);
    },
    async rejectTask(userId, taskId, reason) {
        const task = await this.getNgoTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    status: client_1.NgoTaskStatus.REJECTED,
                    ngoDecision: client_1.NgoDecision.REJECTED,
                    rejectionReason: reason,
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.REJECTED,
                changedByUserId: userId,
                note: reason,
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.REJECTED_BY_NGO, userId, reason);
        });
        return this.getNgoTask(userId, taskId);
    },
    async assignVolunteer(userId, taskId, input) {
        const ngo = await getNgoAdminNgo(userId);
        const task = await this.getNgoTask(userId, taskId);
        const volunteers = ngo.volunteers.map((volunteer) => ({
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
        }));
        const ranked = await ai_service_1.aiService.matchVolunteer({
            latitude: task.latitude,
            longitude: task.longitude,
            title: task.title,
            description: task.description,
            categoryName: task.category?.name,
        }, volunteers);
        const selectedVolunteerIds = Array.from(new Set((input.volunteerIds?.length
            ? input.volunteerIds
            : [input.volunteerId ?? ranked[0]?.volunteerId]).filter(Boolean)));
        if (selectedVolunteerIds.length === 0) {
            throw new app_error_1.AppError("No suitable volunteer was found for this task.", 400);
        }
        const selectedVolunteers = ngo.volunteers.filter((volunteer) => selectedVolunteerIds.includes(volunteer.id));
        if (selectedVolunteers.length !== selectedVolunteerIds.length) {
            throw new app_error_1.AppError("One or more selected volunteers do not belong to this NGO.", 400);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            const existingAssignments = await tx.volunteerAssignment.findMany({
                where: {
                    taskId,
                    volunteerId: { in: selectedVolunteerIds },
                },
                select: { volunteerId: true },
            });
            const existingVolunteerIds = new Set(existingAssignments.map((assignment) => assignment.volunteerId));
            await tx.aiDecision.create({
                data: {
                    taskId,
                    decisionType: client_1.AiDecisionType.VOLUNTEER_MATCH,
                    inputPayloadJson: {
                        taskId,
                    },
                    outputPayloadJson: ranked,
                    confidenceScore: ranked[0]?.score ?? 0,
                },
            });
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    assignedVolunteerId: selectedVolunteerIds[0],
                    assignedByUserId: userId,
                    dueDate: input.dueDate,
                    status: client_1.NgoTaskStatus.ASSIGNED,
                },
            });
            for (const volunteerId of selectedVolunteerIds) {
                await tx.volunteerAssignment.upsert({
                    where: {
                        taskId_volunteerId: {
                            taskId,
                            volunteerId,
                        },
                    },
                    update: {
                        assignmentStatus: client_1.AssignmentStatus.PENDING,
                        aiMatchScore: ranked.find((candidate) => candidate.volunteerId === volunteerId)?.score,
                        assignedByUserId: userId,
                        note: input.note,
                    },
                    create: {
                        taskId,
                        volunteerId,
                        assignmentStatus: client_1.AssignmentStatus.PENDING,
                        aiMatchScore: ranked.find((candidate) => candidate.volunteerId === volunteerId)?.score,
                        assignedByUserId: userId,
                        note: input.note,
                    },
                });
                if (!existingVolunteerIds.has(volunteerId)) {
                    await tx.volunteerProfile.update({
                        where: { id: volunteerId },
                        data: {
                            currentWorkload: {
                                increment: 1,
                            },
                        },
                    });
                }
            }
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.ASSIGNED,
                changedByUserId: userId,
                note: input.note ?? "Volunteer assigned.",
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.VOLUNTEER_ASSIGNED, userId, input.note ?? "Volunteer assigned.");
        });
        await Promise.all(selectedVolunteers.map((volunteer) => notification_service_1.notificationService.create({
            recipientUserId: volunteer.userId,
            role: client_1.Role.VOLUNTEER,
            title: "New task assigned",
            body: `${task.title} has been assigned to you.`,
            type: client_1.NotificationType.VOLUNTEER_ASSIGNED,
            meta: {
                taskId,
            },
        })));
        return this.getNgoTask(userId, taskId);
    },
    async reassignTask(userId, taskId, input) {
        const task = await this.getNgoTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    assignedVolunteerId: null,
                    status: client_1.NgoTaskStatus.REASSIGNMENT_NEEDED,
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.REASSIGNMENT_NEEDED,
                changedByUserId: userId,
                note: input.reason,
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.REASSIGNMENT_PENDING, userId, input.reason);
        });
        if (input.volunteerId) {
            return this.assignVolunteer(userId, taskId, {
                volunteerId: input.volunteerId,
                note: input.reason,
            });
        }
        return this.getNgoTask(userId, taskId);
    },
    async verifyTask(userId, taskId, input) {
        const task = await this.getNgoTask(userId, taskId);
        const assignedVolunteerIds = Array.from(new Set(task.assignments.map((assignment) => assignment.volunteerId)));
        if (!input.approved) {
            return this.requestRework(userId, taskId, { note: input.note ?? "Evidence rejected." });
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.taskEvidence.updateMany({
                where: {
                    taskId,
                    verificationStatus: client_1.EvidenceVerificationStatus.PENDING,
                },
                data: {
                    verificationStatus: client_1.EvidenceVerificationStatus.VERIFIED,
                    reviewedAt: new Date(),
                    reviewedByUserId: userId,
                },
            });
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    status: client_1.NgoTaskStatus.VERIFIED_CLOSED,
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.VERIFIED_CLOSED,
                changedByUserId: userId,
                note: input.note ?? "Task verified and closed.",
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.VERIFIED_CLOSED, userId, input.note ?? "Task verified and closed.");
            if (assignedVolunteerIds.length > 0) {
                await tx.volunteerProfile.updateMany({
                    where: { id: { in: assignedVolunteerIds } },
                    data: {
                        currentWorkload: {
                            decrement: 1,
                        },
                        tasksCompleted: {
                            increment: 1,
                        },
                    },
                });
                await tx.volunteerAssignment.updateMany({
                    where: {
                        taskId,
                        volunteerId: { in: assignedVolunteerIds },
                    },
                    data: {
                        assignmentStatus: client_1.AssignmentStatus.VERIFIED_CLOSED,
                    },
                });
            }
        });
        await Promise.all(task.assignments.map((assignment) => notification_service_1.notificationService.create({
            recipientUserId: assignment.volunteer.userId,
            role: client_1.Role.VOLUNTEER,
            title: "Task verified",
            body: `${task.title} has been verified by your NGO admin.`,
            type: client_1.NotificationType.TASK_VERIFIED,
            meta: { taskId },
        })));
        return this.getNgoTask(userId, taskId);
    },
    async requestRework(userId, taskId, input) {
        const task = await this.getNgoTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.taskEvidence.updateMany({
                where: {
                    taskId,
                    verificationStatus: client_1.EvidenceVerificationStatus.PENDING,
                },
                data: {
                    verificationStatus: client_1.EvidenceVerificationStatus.REJECTED,
                    reviewedAt: new Date(),
                    reviewedByUserId: userId,
                },
            });
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    status: client_1.NgoTaskStatus.REWORK_NEEDED,
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.REWORK_NEEDED,
                changedByUserId: userId,
                note: input.note,
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.IN_PROGRESS, userId, input.note);
            await tx.volunteerAssignment.updateMany({
                where: { taskId },
                data: {
                    assignmentStatus: client_1.AssignmentStatus.IN_PROGRESS,
                    note: input.note,
                },
            });
        });
        await Promise.all(task.assignments.map((assignment) => notification_service_1.notificationService.create({
            recipientUserId: assignment.volunteer.userId,
            role: client_1.Role.VOLUNTEER,
            title: "Rework requested",
            body: `${task.title} needs more work before it can be closed.`,
            type: client_1.NotificationType.REWORK_REQUESTED,
            meta: { taskId },
        })));
        return this.getNgoTask(userId, taskId);
    },
    async listNgoVolunteers(userId) {
        const ngo = await getNgoAdminNgo(userId);
        return ngo.volunteers;
    },
    async listNgoSurveyors(userId) {
        const ngo = await getNgoAdminNgo(userId);
        return ngo.surveyors;
    },
    async getNgoDashboard(userId) {
        const ngo = await getNgoAdminNgo(userId);
        const [taskCounts, pendingVerification, activeVolunteers] = await Promise.all([
            prisma_1.prisma.ngoTask.groupBy({
                by: ["status"],
                where: { ngoId: ngo.id },
                _count: { _all: true },
            }),
            prisma_1.prisma.ngoTask.count({
                where: {
                    ngoId: ngo.id,
                    status: client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
                },
            }),
            prisma_1.prisma.volunteerProfile.count({
                where: {
                    ngoId: ngo.id,
                    availabilityStatus: client_1.AvailabilityStatus.AVAILABLE,
                },
            }),
        ]);
        return {
            ngo: {
                id: ngo.id,
                name: ngo.name,
                domains: ngo.domains.map((domain) => ({
                    id: domain.category.id,
                    name: domain.category.name,
                    slug: domain.category.slug,
                })),
            },
            taskCounts,
            pendingVerification,
            activeVolunteers,
            surveyorCount: ngo.surveyors.length,
        };
    },
    async listVolunteerTasks(userId) {
        const volunteer = await getVolunteerProfile(userId);
        return prisma_1.prisma.ngoTask.findMany({
            where: {
                assignments: {
                    some: {
                        volunteerId: volunteer.id,
                    },
                },
            },
            include: taskInclude,
            orderBy: { createdAt: "desc" },
        });
    },
    async getVolunteerTask(userId, taskId) {
        const volunteer = await getVolunteerProfile(userId);
        const task = await prisma_1.prisma.ngoTask.findFirst({
            where: {
                id: taskId,
                assignments: {
                    some: {
                        volunteerId: volunteer.id,
                    },
                },
            },
            include: taskInclude,
        });
        if (!task) {
            throw new app_error_1.AppError("Task not found.", 404);
        }
        return task;
    },
    async respondToAssignment(userId, taskId, accepted, note) {
        const volunteer = await getVolunteerProfile(userId);
        const task = await this.getVolunteerTask(userId, taskId);
        const status = accepted ? client_1.AssignmentStatus.ACCEPTED : client_1.AssignmentStatus.REJECTED;
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.volunteerAssignment.updateMany({
                where: {
                    taskId,
                    volunteerId: volunteer.id,
                },
                data: {
                    assignmentStatus: status,
                    respondedAt: new Date(),
                    note,
                },
            });
            if (!accepted) {
                await tx.ngoTask.update({
                    where: { id: taskId },
                    data: {
                        status: client_1.NgoTaskStatus.VOLUNTEER_REJECTED,
                    },
                });
                await workflow_service_1.workflowService.recordTaskStatus(tx, {
                    taskId,
                    oldStatus: task.status,
                    newStatus: client_1.NgoTaskStatus.VOLUNTEER_REJECTED,
                    changedByUserId: userId,
                    note: note ?? "Volunteer rejected assignment.",
                });
                await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.REASSIGNMENT_PENDING, userId, note ?? "Volunteer rejected assignment.");
            }
        });
        if (task.assignedByUserId) {
            await notification_service_1.notificationService.create({
                recipientUserId: task.assignedByUserId,
                role: client_1.Role.NGO_ADMIN,
                title: accepted ? "Volunteer accepted task" : "Volunteer rejected task",
                body: `${volunteer.user.fullName} ${accepted ? "accepted" : "rejected"} ${task.title}.`,
                type: client_1.NotificationType.VOLUNTEER_RESPONSE,
                meta: {
                    taskId,
                },
            });
        }
        return this.getVolunteerTask(userId, taskId);
    },
    async updateVolunteerTaskStatus(userId, taskId, input) {
        const volunteer = await getVolunteerProfile(userId);
        const task = await this.getVolunteerTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            const assignmentStatus = input.status === "accepted"
                ? client_1.AssignmentStatus.ACCEPTED
                : input.status === "on_the_way"
                    ? client_1.AssignmentStatus.ON_THE_WAY
                    : input.status === "in_progress"
                        ? client_1.AssignmentStatus.IN_PROGRESS
                        : client_1.AssignmentStatus.COMPLETED_PENDING_VERIFICATION;
            await tx.volunteerAssignment.updateMany({
                where: {
                    taskId,
                    volunteerId: volunteer.id,
                },
                data: {
                    assignmentStatus,
                    respondedAt: new Date(),
                    note: input.note,
                },
            });
            if (input.status === "in_progress" || input.status === "completed_pending_verification") {
                const nextTaskStatus = input.status === "in_progress"
                    ? client_1.NgoTaskStatus.IN_PROGRESS
                    : client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION;
                const nextReportStatus = input.status === "in_progress"
                    ? client_1.MasterReportStatus.IN_PROGRESS
                    : client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION;
                await tx.ngoTask.update({
                    where: { id: taskId },
                    data: {
                        status: nextTaskStatus,
                    },
                });
                await workflow_service_1.workflowService.recordTaskStatus(tx, {
                    taskId,
                    oldStatus: task.status,
                    newStatus: nextTaskStatus,
                    changedByUserId: userId,
                    note: input.note,
                });
                await updateLinkedReportStatus(tx, taskId, nextReportStatus, userId, input.note ?? input.status);
            }
        });
        if (task.assignedByUserId && input.status !== "accepted") {
            await notification_service_1.notificationService.create({
                recipientUserId: task.assignedByUserId,
                role: client_1.Role.NGO_ADMIN,
                title: "Volunteer status updated",
                body: `${volunteer.user.fullName} marked ${task.title} as ${input.status.replace(/_/g, " ")}.`,
                type: client_1.NotificationType.TASK_STATUS,
                meta: { taskId, status: input.status },
            });
        }
        return this.getVolunteerTask(userId, taskId);
    },
    async uploadEvidence(userId, taskId, input) {
        const volunteer = await getVolunteerProfile(userId);
        const task = await this.getVolunteerTask(userId, taskId);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.taskEvidence.create({
                data: {
                    taskId,
                    volunteerId: volunteer.id,
                    mediaUrl: input.mediaUrl,
                    mediaType: input.mediaType,
                    note: input.note,
                },
            });
            await tx.ngoTask.update({
                where: { id: taskId },
                data: {
                    status: client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
                },
            });
            await tx.volunteerAssignment.updateMany({
                where: {
                    taskId,
                    volunteerId: volunteer.id,
                },
                data: {
                    assignmentStatus: client_1.AssignmentStatus.COMPLETED_PENDING_VERIFICATION,
                },
            });
            await workflow_service_1.workflowService.recordTaskStatus(tx, {
                taskId,
                oldStatus: task.status,
                newStatus: client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
                changedByUserId: userId,
                note: input.note ?? "Evidence uploaded for verification.",
            });
            await updateLinkedReportStatus(tx, taskId, client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION, userId, input.note ?? "Evidence uploaded for verification.");
        });
        if (task.assignedByUserId) {
            await notification_service_1.notificationService.create({
                recipientUserId: task.assignedByUserId,
                role: client_1.Role.NGO_ADMIN,
                title: "Evidence uploaded",
                body: `${volunteer.user.fullName} uploaded completion evidence for ${task.title}.`,
                type: client_1.NotificationType.TASK_EVIDENCE,
                meta: { taskId },
            });
        }
        return this.getVolunteerTask(userId, taskId);
    },
    async updateAvailability(userId, input) {
        const volunteer = await getVolunteerProfile(userId);
        return prisma_1.prisma.volunteerProfile.update({
            where: { id: volunteer.id },
            data: {
                availabilityStatus: input.availabilityStatus,
                latitude: input.latitude ?? volunteer.latitude,
                longitude: input.longitude ?? volunteer.longitude,
                serviceRadiusKm: input.serviceRadiusKm ?? volunteer.serviceRadiusKm,
                availableFrom: input.availableFrom,
                availableTo: input.availableTo,
            },
            include: {
                user: true,
                ngo: true,
            },
        });
    },
    async getVolunteerDashboard(userId) {
        const volunteer = await getVolunteerProfile(userId);
        const assignments = await prisma_1.prisma.volunteerAssignment.groupBy({
            by: ["assignmentStatus"],
            where: {
                volunteerId: volunteer.id,
            },
            _count: { _all: true },
        });
        return {
            volunteer,
            assignments,
        };
    },
};
