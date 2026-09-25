import { z } from "zod";
import { ENUM_ARRAYS } from "../../constants/index.js";

export const idParam = z.object({ id: z.string().min(1) });

const billingSchema = z.object({
  firstName: z.string().trim().max(100).optional().default(""),
  lastName: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  zip: z.string().trim().max(20).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const createOrderSchema = z
  .object({
    kind: z.enum(ENUM_ARRAYS.ORDER_KINDS),
    planId: z.string().min(1).optional(),
    packId: z.string().min(1).optional(),
    couponCode: z.string().trim().max(50).nullable().optional().default(null),
    billing: billingSchema.optional(),
  })
  .refine((v) => v.kind === "PLAN" ? Boolean(v.planId) : Boolean(v.packId), {
    message: "planId (for PLAN) or packId (for PACK) is required",
    path: ["planId"],
  });

export const payOrderSchema = z.object({
  paymentMethod: z.enum(ENUM_ARRAYS.PAYMENT_METHODS).optional().default("CARD"),
  // Dev-only: a real gateway signature would replace this.
  transactionRef: z.string().trim().max(200).optional(),
});

export const couponSchema = z.object({ code: z.string().trim().min(1).max(50) });

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(ENUM_ARRAYS.ORDER_STATUSES).optional(),
  kind: z.enum(ENUM_ARRAYS.ORDER_KINDS).optional(),
  search: z.string().trim().max(120).optional(),
});
