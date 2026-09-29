import { z } from "zod";

export const blockUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(""),
});

export const idParam = z.object({ id: z.string().min(1) });

export const listBlocksSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
