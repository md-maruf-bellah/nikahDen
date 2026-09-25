import { z } from "zod";

export const idParam = z.object({ id: z.string().min(1) });

export const startConversationSchema = z.object({
  recipientId: z.string().min(1, "recipientId is required"),
  text: z.string().trim().min(1).max(5000).optional(),
});

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, "Message text is required").max(5000),
});

export const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(120).optional(),
});
