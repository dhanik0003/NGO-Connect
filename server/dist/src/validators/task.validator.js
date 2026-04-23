"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailabilitySchema = exports.uploadEvidenceSchema = exports.volunteerTaskStatusSchema = exports.volunteerTaskResponseSchema = exports.requestReworkSchema = exports.verifyTaskSchema = exports.reassignTaskSchema = exports.assignVolunteerSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const coordinate = zod_1.z.coerce.number().min(-180).max(180);
exports.assignVolunteerSchema = zod_1.z.object({
    volunteerId: zod_1.z.string().min(10).optional(),
    volunteerIds: zod_1.z.array(zod_1.z.string().min(10)).min(1).optional(),
    dueDate: zod_1.z.coerce.date().optional(),
    note: zod_1.z.string().trim().max(300).optional(),
});
exports.reassignTaskSchema = zod_1.z.object({
    volunteerId: zod_1.z.string().min(10).optional(),
    reason: zod_1.z.string().trim().min(5).max(300),
});
exports.verifyTaskSchema = zod_1.z.object({
    approved: zod_1.z.coerce.boolean(),
    note: zod_1.z.string().trim().max(300).optional(),
});
exports.requestReworkSchema = zod_1.z.object({
    note: zod_1.z.string().trim().min(5).max(300),
});
exports.volunteerTaskResponseSchema = zod_1.z.object({
    note: zod_1.z.string().trim().max(300).optional(),
});
exports.volunteerTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["accepted", "on_the_way", "in_progress", "completed_pending_verification"]),
    note: zod_1.z.string().trim().max(300).optional(),
});
exports.uploadEvidenceSchema = zod_1.z.object({
    note: zod_1.z.string().trim().max(300).optional(),
});
exports.updateAvailabilitySchema = zod_1.z.object({
    availabilityStatus: zod_1.z.nativeEnum(client_1.AvailabilityStatus),
    latitude: coordinate.optional(),
    longitude: coordinate.optional(),
    serviceRadiusKm: zod_1.z.coerce.number().positive().max(500).optional(),
    availableFrom: zod_1.z.coerce.date().optional(),
    availableTo: zod_1.z.coerce.date().optional(),
});
