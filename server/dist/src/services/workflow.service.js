"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = void 0;
exports.workflowService = {
    async recordReportStatus(tx, payload) {
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
    async recordTaskStatus(tx, payload) {
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
    async recordAudit(tx, payload) {
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
