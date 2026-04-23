import {
  AiDecisionType,
  AssignmentStatus,
  AvailabilityStatus,
  EvidenceVerificationStatus,
  MasterReportStatus,
  NgoDecision,
  NgoTaskStatus,
  NotificationType,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import { aiService } from "../ai/ai.service";
import { workflowService } from "./workflow.service";
import { notificationService } from "./notification.service";

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
} as const;

const getNgoAdminNgo = async (userId: string) => {
  const ngo = await prisma.ngo.findFirst({
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
    throw new AppError("NGO admin workspace not found.", 404);
  }

  return ngo;
};

const getVolunteerProfile = async (userId: string) => {
  const volunteer = await prisma.volunteerProfile.findFirst({
    where: { userId },
    include: {
      user: true,
      ngo: true,
    },
  });

  if (!volunteer) {
    throw new AppError("Volunteer profile not found.", 404);
  }

  return volunteer;
};

const updateLinkedReportStatus = async (
  tx: Parameters<typeof workflowService.recordTaskStatus>[0],
  taskId: string,
  newStatus: MasterReportStatus,
  changedByUserId: string,
  note: string,
) => {
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

  await workflowService.recordReportStatus(tx, {
    reportId: task.masterReport.id,
    oldStatus: task.masterReport.status,
    newStatus,
    changedByUserId,
    note,
  });
};

export const taskService = {
  async listNgoTasks(userId: string) {
    const ngo = await getNgoAdminNgo(userId);

    return prisma.ngoTask.findMany({
      where: { ngoId: ngo.id },
      include: taskInclude,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    });
  },

  async getNgoTask(userId: string, taskId: string) {
    const ngo = await getNgoAdminNgo(userId);
    const task = await prisma.ngoTask.findFirst({
      where: {
        id: taskId,
        ngoId: ngo.id,
      },
      include: taskInclude,
    });

    if (!task) {
      throw new AppError("Task not found.", 404);
    }

    return task;
  },

  async acceptTask(userId: string, taskId: string) {
    const task = await this.getNgoTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
      await tx.ngoTask.update({
        where: { id: taskId },
        data: {
          status: NgoTaskStatus.ACCEPTED,
          ngoDecision: NgoDecision.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.ACCEPTED,
        changedByUserId: userId,
        note: "NGO accepted the routed task.",
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.ACCEPTED_BY_NGO,
        userId,
        "NGO accepted the routed task.",
      );
    });

    return this.getNgoTask(userId, taskId);
  },

  async rejectTask(userId: string, taskId: string, reason: string) {
    const task = await this.getNgoTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
      await tx.ngoTask.update({
        where: { id: taskId },
        data: {
          status: NgoTaskStatus.REJECTED,
          ngoDecision: NgoDecision.REJECTED,
          rejectionReason: reason,
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.REJECTED,
        changedByUserId: userId,
        note: reason,
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.REJECTED_BY_NGO,
        userId,
        reason,
      );
    });

    return this.getNgoTask(userId, taskId);
  },

  async assignVolunteer(
    userId: string,
    taskId: string,
    input: { volunteerId?: string; volunteerIds?: string[]; dueDate?: Date; note?: string },
  ) {
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
      skills: Array.isArray(volunteer.skillsJson) ? (volunteer.skillsJson as string[]) : [],
    }));

    const ranked = await aiService.matchVolunteer(
      {
        latitude: task.latitude,
        longitude: task.longitude,
        title: task.title,
        description: task.description,
        categoryName: task.category?.name,
      },
      volunteers,
    );

    const selectedVolunteerIds = Array.from(
      new Set(
        (input.volunteerIds?.length
          ? input.volunteerIds
          : [input.volunteerId ?? ranked[0]?.volunteerId]).filter(Boolean) as string[],
      ),
    );

    if (selectedVolunteerIds.length === 0) {
      throw new AppError("No suitable volunteer was found for this task.", 400);
    }

    const selectedVolunteers = ngo.volunteers.filter((volunteer) =>
      selectedVolunteerIds.includes(volunteer.id),
    );
    if (selectedVolunteers.length !== selectedVolunteerIds.length) {
      throw new AppError("One or more selected volunteers do not belong to this NGO.", 400);
    }

    await prisma.$transaction(async (tx) => {
      const existingAssignments = await tx.volunteerAssignment.findMany({
        where: {
          taskId,
          volunteerId: { in: selectedVolunteerIds },
        },
        select: { volunteerId: true },
      });
      const existingVolunteerIds = new Set(
        existingAssignments.map((assignment) => assignment.volunteerId),
      );

      await tx.aiDecision.create({
        data: {
          taskId,
          decisionType: AiDecisionType.VOLUNTEER_MATCH,
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
          status: NgoTaskStatus.ASSIGNED,
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
            assignmentStatus: AssignmentStatus.PENDING,
            aiMatchScore: ranked.find((candidate) => candidate.volunteerId === volunteerId)?.score,
            assignedByUserId: userId,
            note: input.note,
          },
          create: {
            taskId,
            volunteerId,
            assignmentStatus: AssignmentStatus.PENDING,
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

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.ASSIGNED,
        changedByUserId: userId,
        note: input.note ?? "Volunteer assigned.",
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.VOLUNTEER_ASSIGNED,
        userId,
        input.note ?? "Volunteer assigned.",
      );
    });

    await Promise.all(
      selectedVolunteers.map((volunteer) =>
        notificationService.create({
          recipientUserId: volunteer.userId,
          role: Role.VOLUNTEER,
          title: "New task assigned",
          body: `${task.title} has been assigned to you.`,
          type: NotificationType.VOLUNTEER_ASSIGNED,
          meta: {
            taskId,
          },
        }),
      ),
    );

    return this.getNgoTask(userId, taskId);
  },

  async reassignTask(userId: string, taskId: string, input: { volunteerId?: string; reason: string }) {
    const task = await this.getNgoTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
      await tx.ngoTask.update({
        where: { id: taskId },
        data: {
          assignedVolunteerId: null,
          status: NgoTaskStatus.REASSIGNMENT_NEEDED,
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.REASSIGNMENT_NEEDED,
        changedByUserId: userId,
        note: input.reason,
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.REASSIGNMENT_PENDING,
        userId,
        input.reason,
      );
    });

    if (input.volunteerId) {
      return this.assignVolunteer(userId, taskId, {
        volunteerId: input.volunteerId,
        note: input.reason,
      });
    }

    return this.getNgoTask(userId, taskId);
  },

  async verifyTask(userId: string, taskId: string, input: { approved: boolean; note?: string }) {
    const task = await this.getNgoTask(userId, taskId);
    const assignedVolunteerIds = Array.from(
      new Set(task.assignments.map((assignment) => assignment.volunteerId)),
    );

    if (!input.approved) {
      return this.requestRework(userId, taskId, { note: input.note ?? "Evidence rejected." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskEvidence.updateMany({
        where: {
          taskId,
          verificationStatus: EvidenceVerificationStatus.PENDING,
        },
        data: {
          verificationStatus: EvidenceVerificationStatus.VERIFIED,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
        },
      });

      await tx.ngoTask.update({
        where: { id: taskId },
        data: {
          status: NgoTaskStatus.VERIFIED_CLOSED,
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.VERIFIED_CLOSED,
        changedByUserId: userId,
        note: input.note ?? "Task verified and closed.",
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.VERIFIED_CLOSED,
        userId,
        input.note ?? "Task verified and closed.",
      );

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
            assignmentStatus: AssignmentStatus.VERIFIED_CLOSED,
          },
        });
      }
    });

    await Promise.all(
      task.assignments.map((assignment) =>
        notificationService.create({
          recipientUserId: assignment.volunteer.userId,
          role: Role.VOLUNTEER,
          title: "Task verified",
          body: `${task.title} has been verified by your NGO admin.`,
          type: NotificationType.TASK_VERIFIED,
          meta: { taskId },
        }),
      ),
    );

    return this.getNgoTask(userId, taskId);
  },

  async requestRework(userId: string, taskId: string, input: { note: string }) {
    const task = await this.getNgoTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
      await tx.taskEvidence.updateMany({
        where: {
          taskId,
          verificationStatus: EvidenceVerificationStatus.PENDING,
        },
        data: {
          verificationStatus: EvidenceVerificationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedByUserId: userId,
        },
      });

      await tx.ngoTask.update({
        where: { id: taskId },
        data: {
          status: NgoTaskStatus.REWORK_NEEDED,
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.REWORK_NEEDED,
        changedByUserId: userId,
        note: input.note,
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.IN_PROGRESS,
        userId,
        input.note,
      );

      await tx.volunteerAssignment.updateMany({
        where: { taskId },
        data: {
          assignmentStatus: AssignmentStatus.IN_PROGRESS,
          note: input.note,
        },
      });
    });

    await Promise.all(
      task.assignments.map((assignment) =>
        notificationService.create({
          recipientUserId: assignment.volunteer.userId,
          role: Role.VOLUNTEER,
          title: "Rework requested",
          body: `${task.title} needs more work before it can be closed.`,
          type: NotificationType.REWORK_REQUESTED,
          meta: { taskId },
        }),
      ),
    );

    return this.getNgoTask(userId, taskId);
  },

  async listNgoVolunteers(userId: string) {
    const ngo = await getNgoAdminNgo(userId);
    return ngo.volunteers;
  },

  async listNgoSurveyors(userId: string) {
    const ngo = await getNgoAdminNgo(userId);
    return ngo.surveyors;
  },

  async getNgoDashboard(userId: string) {
    const ngo = await getNgoAdminNgo(userId);

    const [taskCounts, pendingVerification, activeVolunteers] = await Promise.all([
      prisma.ngoTask.groupBy({
        by: ["status"],
        where: { ngoId: ngo.id },
        _count: { _all: true },
      }),
      prisma.ngoTask.count({
        where: {
          ngoId: ngo.id,
          status: NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
        },
      }),
      prisma.volunteerProfile.count({
        where: {
          ngoId: ngo.id,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
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

  async listVolunteerTasks(userId: string) {
    const volunteer = await getVolunteerProfile(userId);
    return prisma.ngoTask.findMany({
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

  async getVolunteerTask(userId: string, taskId: string) {
    const volunteer = await getVolunteerProfile(userId);
    const task = await prisma.ngoTask.findFirst({
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
      throw new AppError("Task not found.", 404);
    }

    return task;
  },

  async respondToAssignment(userId: string, taskId: string, accepted: boolean, note?: string) {
    const volunteer = await getVolunteerProfile(userId);
    const task = await this.getVolunteerTask(userId, taskId);
    const status = accepted ? AssignmentStatus.ACCEPTED : AssignmentStatus.REJECTED;

    await prisma.$transaction(async (tx) => {
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
            status: NgoTaskStatus.VOLUNTEER_REJECTED,
          },
        });

        await workflowService.recordTaskStatus(tx, {
          taskId,
          oldStatus: task.status,
          newStatus: NgoTaskStatus.VOLUNTEER_REJECTED,
          changedByUserId: userId,
          note: note ?? "Volunteer rejected assignment.",
        });

        await updateLinkedReportStatus(
          tx,
          taskId,
          MasterReportStatus.REASSIGNMENT_PENDING,
          userId,
          note ?? "Volunteer rejected assignment.",
        );
      }
    });

    if (task.assignedByUserId) {
      await notificationService.create({
        recipientUserId: task.assignedByUserId,
        role: Role.NGO_ADMIN,
        title: accepted ? "Volunteer accepted task" : "Volunteer rejected task",
        body: `${volunteer.user.fullName} ${accepted ? "accepted" : "rejected"} ${task.title}.`,
        type: NotificationType.VOLUNTEER_RESPONSE,
        meta: {
          taskId,
        },
      });
    }

    return this.getVolunteerTask(userId, taskId);
  },

  async updateVolunteerTaskStatus(
    userId: string,
    taskId: string,
    input: { status: "accepted" | "on_the_way" | "in_progress" | "completed_pending_verification"; note?: string },
  ) {
    const volunteer = await getVolunteerProfile(userId);
    const task = await this.getVolunteerTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
      const assignmentStatus =
        input.status === "accepted"
          ? AssignmentStatus.ACCEPTED
          : input.status === "on_the_way"
            ? AssignmentStatus.ON_THE_WAY
            : input.status === "in_progress"
              ? AssignmentStatus.IN_PROGRESS
              : AssignmentStatus.COMPLETED_PENDING_VERIFICATION;

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
        const nextTaskStatus =
          input.status === "in_progress"
            ? NgoTaskStatus.IN_PROGRESS
            : NgoTaskStatus.COMPLETED_PENDING_VERIFICATION;
        const nextReportStatus =
          input.status === "in_progress"
            ? MasterReportStatus.IN_PROGRESS
            : MasterReportStatus.COMPLETED_PENDING_VERIFICATION;

        await tx.ngoTask.update({
          where: { id: taskId },
          data: {
            status: nextTaskStatus,
          },
        });

        await workflowService.recordTaskStatus(tx, {
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
      await notificationService.create({
        recipientUserId: task.assignedByUserId,
        role: Role.NGO_ADMIN,
        title: "Volunteer status updated",
        body: `${volunteer.user.fullName} marked ${task.title} as ${input.status.replace(/_/g, " ")}.`,
        type: NotificationType.TASK_STATUS,
        meta: { taskId, status: input.status },
      });
    }

    return this.getVolunteerTask(userId, taskId);
  },

  async uploadEvidence(userId: string, taskId: string, input: { mediaUrl: string; mediaType: string; note?: string }) {
    const volunteer = await getVolunteerProfile(userId);
    const task = await this.getVolunteerTask(userId, taskId);

    await prisma.$transaction(async (tx) => {
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
          status: NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
        },
      });

      await tx.volunteerAssignment.updateMany({
        where: {
          taskId,
          volunteerId: volunteer.id,
        },
        data: {
          assignmentStatus: AssignmentStatus.COMPLETED_PENDING_VERIFICATION,
        },
      });

      await workflowService.recordTaskStatus(tx, {
        taskId,
        oldStatus: task.status,
        newStatus: NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
        changedByUserId: userId,
        note: input.note ?? "Evidence uploaded for verification.",
      });

      await updateLinkedReportStatus(
        tx,
        taskId,
        MasterReportStatus.COMPLETED_PENDING_VERIFICATION,
        userId,
        input.note ?? "Evidence uploaded for verification.",
      );
    });

    if (task.assignedByUserId) {
      await notificationService.create({
        recipientUserId: task.assignedByUserId,
        role: Role.NGO_ADMIN,
        title: "Evidence uploaded",
        body: `${volunteer.user.fullName} uploaded completion evidence for ${task.title}.`,
        type: NotificationType.TASK_EVIDENCE,
        meta: { taskId },
      });
    }

    return this.getVolunteerTask(userId, taskId);
  },

  async updateAvailability(
    userId: string,
    input: {
      availabilityStatus: AvailabilityStatus;
      latitude?: number;
      longitude?: number;
      serviceRadiusKm?: number;
      availableFrom?: Date;
      availableTo?: Date;
    },
  ) {
    const volunteer = await getVolunteerProfile(userId);

    return prisma.volunteerProfile.update({
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

  async getVolunteerDashboard(userId: string) {
    const volunteer = await getVolunteerProfile(userId);
    const assignments = await prisma.volunteerAssignment.groupBy({
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
