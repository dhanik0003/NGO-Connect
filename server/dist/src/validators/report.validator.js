"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalateSchema = exports.mergeDuplicateSchema = exports.markInvalidSchema = exports.routeReportSchema = exports.classifyReportSchema = exports.surveyorReportSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
const coordinate = zod_1.z.coerce.number().min(-180).max(180);
exports.createReportSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3).max(160),
    description: zod_1.z.string().trim().min(10).max(2000),
    categorySlug: zod_1.z.string().trim().min(2).optional(),
    latitude: coordinate,
    longitude: coordinate,
    address: zod_1.z.string().trim().min(4).max(250),
});
exports.surveyorReportSchema = exports.createReportSchema.extend({
    categoryConfidence: zod_1.z.coerce.number().min(0).max(100).optional(),
    isEmergency: zod_1.z.coerce.boolean().optional(),
    preferredRoute: zod_1.z.enum(["ngo", "central"]).optional(),
});
exports.classifyReportSchema = zod_1.z.object({
    categorySlug: zod_1.z.string().trim().min(2).optional(),
});
exports.routeReportSchema = zod_1.z.object({
    ngoId: zod_1.z.string().min(10),
});
exports.markInvalidSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5).max(500),
});
exports.mergeDuplicateSchema = zod_1.z.object({
    canonicalReportId: zod_1.z.string().min(10),
});
exports.escalateSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5).max(500),
});
