import type {
  MasterReportStatus,
  NgoTaskStatus,
  Prisma,
  Role,
} from "@prisma/client";

interface ReportStatusPayload {
  reportId: string;
  oldStatus: MasterReportStatus | null;
  newStatus: MasterReportStatus;
  changedByUserId?: string;
  note?: string;
}

interface TaskStatusPayload {
  taskId: string;
  oldStatus: NgoTaskStatus | null;
  newStatus: NgoTaskStatus;
  changedByUserId?: string;
  note?: string;
}

interface AuditPayload {
  actorUserId?: string;
  actorRole?: Role;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export const workflowService = {
  async recordReportStatus(tx: Prisma.TransactionClient, payload: ReportStatusPayload) {
    if (payload.oldStatus !== payload.newStatus) {
      await tx.reportStatusHistory.create({
        data: {
          reportId: payload.reportId,
          oldStatus: payload.oldStatus ?? undefined,
          newStatus: payload.newStatus,
          changedByUserId: payload.changedByUserId,
          note: payload.note,
        },
      });
    }
  },

  async recordTaskStatus(tx: Prisma.TransactionClient, payload: TaskStatusPayload) {
    if (payload.oldStatus !== payload.newStatus) {
      await tx.taskStatusHistory.create({
        data: {
          taskId: payload.taskId,
          oldStatus: payload.oldStatus ?? undefined,
          newStatus: payload.newStatus,
          changedByUserId: payload.changedByUserId,
          note: payload.note,
        },
      });
    }
  },

  async recordAudit(tx: Prisma.TransactionClient, payload: AuditPayload) {
    await tx.auditLog.create({
      data: {
        actorUserId: payload.actorUserId,
        actorRole: payload.actorRole,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadataJson: payload.metadata,
      },
    });
  },
};
