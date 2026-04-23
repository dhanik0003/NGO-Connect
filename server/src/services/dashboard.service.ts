import {
  AvailabilityStatus,
  EscalationStatus,
  MasterReportStatus,
  NgoTaskStatus,
  NgoVerificationStatus,
  PriorityLabel,
  Role,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

export const dashboardService = {
  async getAdminDashboard() {
    const [
      approvedNgos,
      activeReports,
      activeVolunteers,
      criticalReports,
      escalations,
      hotspots,
    ] = await Promise.all([
      prisma.ngo.count({
        where: { verificationStatus: NgoVerificationStatus.APPROVED },
      }),
      prisma.masterReport.count({
        where: {
          status: {
            notIn: [MasterReportStatus.INVALID, MasterReportStatus.VERIFIED_CLOSED],
          },
        },
      }),
      prisma.volunteerProfile.count({
        where: { availabilityStatus: AvailabilityStatus.AVAILABLE },
      }),
      prisma.masterReport.count({
        where: { priorityLabel: PriorityLabel.CRITICAL },
      }),
      prisma.escalation.count({
        where: { status: EscalationStatus.OPEN },
      }),
      prisma.masterReport.findMany({
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

  async getSurveyorDashboard(userId: string) {
    const [surveyor, reports] = await Promise.all([
      prisma.surveyorProfile.findFirst({
        where: { userId },
        include: { ngo: true },
      }),
      prisma.masterReport.findMany({
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
      criticalCount: reports.filter((report) => report.priorityLabel === PriorityLabel.CRITICAL).length,
      reports,
    };
  },

  async getRoleAwareDashboard(userId: string, role: Role) {
    if (role === Role.SUPER_ADMIN) {
      return this.getAdminDashboard();
    }

    if (role === Role.SURVEYOR) {
      return this.getSurveyorDashboard(userId);
    }

    if (role === Role.USER) {
      const reports = await prisma.masterReport.findMany({
        where: {
          reporterUserId: userId,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        reports,
        openReports: reports.filter((report) => report.status !== MasterReportStatus.VERIFIED_CLOSED).length,
      };
    }

    if (role === Role.NGO_ADMIN) {
      const ngo = await prisma.ngo.findFirst({
        where: { createdByUserId: userId },
      });

      if (!ngo) {
        return null;
      }

      const tasks = await prisma.ngoTask.groupBy({
        by: ["status"],
        where: { ngoId: ngo.id },
        _count: { _all: true },
      });

      return { ngo, tasks };
    }

    const volunteer = await prisma.volunteerProfile.findFirst({
      where: { userId },
    });

    if (!volunteer) {
      return null;
    }

    const assignments = await prisma.volunteerAssignment.groupBy({
      by: ["assignmentStatus"],
      where: { volunteerId: volunteer.id },
      _count: { _all: true },
    });

    return { volunteer, assignments, taskStatusReference: NgoTaskStatus };
  },
};
