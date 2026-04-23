import { z } from "zod";

const coordinate = z.coerce.number().min(-180).max(180);

export const userRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(100),
  currentAddress: z.string().trim().min(4).max(250),
});

export const ngoRegistrationSchema = z.object({
  ngoName: z.string().trim().min(2).max(160),
  email: z.string().email(),
  officialEmail: z.string().email().optional(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(100),
  description: z.string().trim().min(10).max(1000).optional(),
  headquartersAddress: z.string().trim().min(4).max(250),
  latitude: coordinate.optional(),
  longitude: coordinate.optional(),
  serviceRadiusKm: z.coerce.number().positive().max(500),
  domainSlugs: z.array(z.string().trim().min(2)).min(1).max(1),
  operatingRegions: z
    .array(
      z.object({
        regionName: z.string().trim().min(2).max(120),
        latitude: coordinate,
        longitude: coordinate,
        coverageRadiusKm: z.coerce.number().positive().max(500),
      }),
    )
    .min(1)
    .optional(),
  adminFullName: z.string().trim().min(2).max(120),
  adminPhone: z.string().trim().min(8).max(20).optional(),
});

export const surveyorRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(100),
  ngoId: z.string().min(10),
  assignedAddress: z.string().trim().min(4).max(200),
  serviceRadiusKm: z.coerce.number().positive().max(500),
});

export const volunteerRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(100),
  ngoId: z.string().min(10),
  latitude: coordinate,
  longitude: coordinate,
  serviceRadiusKm: z.coerce.number().positive().max(500),
  skills: z.array(z.string().trim().min(2)).min(1),
  availableFrom: z.coerce.date().optional(),
  availableTo: z.coerce.date().optional(),
  vehicleType: z.string().trim().min(2).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(100),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  currentAddress: z.string().trim().min(4).max(250).nullable().optional(),
  profileImageUrl: z.string().trim().url().optional(),
});
