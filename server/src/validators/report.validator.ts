import { z } from "zod";

const coordinate = z.coerce.number().min(-180).max(180);

export const createReportSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2000),
  categorySlug: z.string().trim().min(2).optional(),
  latitude: coordinate,
  longitude: coordinate,
  address: z.string().trim().min(4).max(250),
});

export const surveyorReportSchema = createReportSchema.extend({
  categoryConfidence: z.coerce.number().min(0).max(100).optional(),
  isEmergency: z.coerce.boolean().optional(),
  preferredRoute: z.enum(["ngo", "central"]).optional(),
});

export const classifyReportSchema = z.object({
  categorySlug: z.string().trim().min(2).optional(),
});

export const routeReportSchema = z.object({
  ngoId: z.string().min(10),
});

export const markInvalidSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const mergeDuplicateSchema = z.object({
  canonicalReportId: z.string().min(10),
});

export const escalateSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});
