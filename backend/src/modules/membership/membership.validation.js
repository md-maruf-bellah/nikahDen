import { z } from "zod";

export const idParam = z.object({ id: z.string().min(1) });

export const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  isActive: z.enum(["1", "true", "0", "false"]).optional(),
});

export const planSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameBn: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).toLowerCase().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(1000).optional().default(""),
  durationDays: z.coerce.number().int().min(1),
  price: z.coerce.number().int().min(0),
  connectCount: z.coerce.number().int().min(0),
  acceptProposalLimit: z.coerce.number().int().min(-1).optional(),
  messagingEnabled: z.boolean().optional(),
  messagingLimit: z.coerce.number().int().min(-1).optional(),
  canCreateBiodata: z.boolean().optional(),
  canSendBiodata: z.boolean().optional(),
  canReceiveBiodata: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const packSchema = z.object({
  name: z.string().trim().min(1).max(100),
  connects: z.coerce.number().int().min(1),
  price: z.coerce.number().int().min(0),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const planUpdateSchema = planSchema.partial();
export const packUpdateSchema = packSchema.partial();
