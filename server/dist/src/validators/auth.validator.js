"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshSchema = exports.loginSchema = exports.volunteerRegistrationSchema = exports.surveyorRegistrationSchema = exports.ngoRegistrationSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
const coordinate = zod_1.z.coerce.number().min(-180).max(180);
exports.userRegistrationSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().trim().min(8).max(20).optional(),
    password: zod_1.z.string().min(8).max(100),
    currentAddress: zod_1.z.string().trim().min(4).max(250),
});
exports.ngoRegistrationSchema = zod_1.z.object({
    ngoName: zod_1.z.string().trim().min(2).max(160),
    email: zod_1.z.string().email(),
    officialEmail: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().trim().min(8).max(20),
    password: zod_1.z.string().min(8).max(100),
    description: zod_1.z.string().trim().min(10).max(1000).optional(),
    headquartersAddress: zod_1.z.string().trim().min(4).max(250),
    latitude: coordinate.optional(),
    longitude: coordinate.optional(),
    serviceRadiusKm: zod_1.z.coerce.number().positive().max(500),
    domainSlugs: zod_1.z.array(zod_1.z.string().trim().min(2)).min(1).max(1),
    operatingRegions: zod_1.z
        .array(zod_1.z.object({
        regionName: zod_1.z.string().trim().min(2).max(120),
        latitude: coordinate,
        longitude: coordinate,
        coverageRadiusKm: zod_1.z.coerce.number().positive().max(500),
    }))
        .min(1)
        .optional(),
    adminFullName: zod_1.z.string().trim().min(2).max(120),
    adminPhone: zod_1.z.string().trim().min(8).max(20).optional(),
});
exports.surveyorRegistrationSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().trim().min(8).max(20).optional(),
    password: zod_1.z.string().min(8).max(100),
    ngoId: zod_1.z.string().min(10),
    assignedAddress: zod_1.z.string().trim().min(4).max(200),
    serviceRadiusKm: zod_1.z.coerce.number().positive().max(500),
});
exports.volunteerRegistrationSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(120),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().trim().min(8).max(20).optional(),
    password: zod_1.z.string().min(8).max(100),
    ngoId: zod_1.z.string().min(10),
    latitude: coordinate,
    longitude: coordinate,
    serviceRadiusKm: zod_1.z.coerce.number().positive().max(500),
    skills: zod_1.z.array(zod_1.z.string().trim().min(2)).min(1),
    availableFrom: zod_1.z.coerce.date().optional(),
    availableTo: zod_1.z.coerce.date().optional(),
    vehicleType: zod_1.z.string().trim().min(2).max(60).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(20),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(20),
    password: zod_1.z.string().min(8).max(100),
});
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2).max(120).optional(),
    phone: zod_1.z.string().trim().min(8).max(20).nullable().optional(),
    currentAddress: zod_1.z.string().trim().min(4).max(250).nullable().optional(),
    profileImageUrl: zod_1.z.string().trim().url().optional(),
});
