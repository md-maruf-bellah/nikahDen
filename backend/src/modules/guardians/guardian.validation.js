import { z } from "zod";

export const GUARDIAN_RELATION_VALUES = [
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "UNCLE",
  "AUNT",
  "ELDER_BROTHER_IN_LAW",
  "OTHER",
];

export const declareSchema = z.object({
  name: z.string().trim().min(2).max(200),
  relation: z.enum(GUARDIAN_RELATION_VALUES).default("OTHER"),
  contactPhone: z.string().trim().min(6).max(20),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal("")).default(""),
  consentChannel: z.enum(["SMS", "EMAIL", "MANUAL"]).default("MANUAL"),
  notes: z.string().trim().max(1000).optional().default(""),
});

// অভিভাবক: consent link রিডিম → guardian-session
export const linkExchangeSchema = z.object({
  token: z.string().trim().min(20).max(4000),
});

// অভিভাবকের guardian-session থেকে — টোকেন নয়, সেশনই প্রমাণ
export const consentSchema = z.object({
  consentChannel: z.enum(["SMS", "EMAIL", "MANUAL"]).optional(),
});

export const verifySchema = z.object({}).passthrough();

export const revokeSchema = z.object({
  reason: z.string().trim().max(500).optional().default(""),
});

// Guardian-to-Guardian contact request
export const contactRequestCreateSchema = z.object({
  targetMemberId: z.string().trim().min(1),
});

export const contactDenySchema = z.object({
  reason: z.string().trim().max(500).optional().default(""),
});

export const idParam = z.object({ id: z.string().min(1) });
