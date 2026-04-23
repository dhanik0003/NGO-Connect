import { AvailabilityStatus } from "@prisma/client";
import { z } from "zod";

const coordinate = z.coerce.number().min(-180).max(180);

export const assignVolunteerSchema = z.object({
  volunteerId: z.string().min(10).optional(),
  volunteerIds: z.array(z.string().min(10)).min(1).optional(),
  dueDate: z.coerce.date().optional(),
  note: z.string().trim().max(300).optional(),
});

export const reassignTaskSchema = z.object({
  volunteerId: z.string().min(10).optional(),
  reason: z.string().trim().min(5).max(300),
});

export const verifyTaskSchema = z.object({
  approved: z.coerce.boolean(),
  note: z.string().trim().max(300).optional(),
});

export const requestReworkSchema = z.object({
  note: z.string().trim().min(5).max(300),
});

export const volunteerTaskResponseSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const volunteerTaskStatusSchema = z.object({
  status: z.enum(["accepted", "on_the_way", "in_progress", "completed_pending_verification"]),
  note: z.string().trim().max(300).optional(),
});

export const uploadEvidenceSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const updateAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(AvailabilityStatus),
  latitude: coordinate.optional(),
  longitude: coordinate.optional(),
  serviceRadiusKm: z.coerce.number().positive().max(500).optional(),
  availableFrom: z.coerce.date().optional(),
  availableTo: z.coerce.date().optional(),
});
