import { z } from "zod";
import { ENUM_ARRAYS } from "../../constants/index.js";

const phone = z
  .string()
  .trim()
  .regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number")
  .optional()
  .or(z.literal(""));

export const idParam = z.object({ id: z.string().min(1) });

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: phone,
  avatar: z.string().trim().max(500).optional(),
});

export const adminCreateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  phone: phone,
  role: z.enum(ENUM_ARRAYS.ROLES).optional(),
  status: z.enum(ENUM_ARRAYS.USER_STATUSES).optional(),
});

export const adminUpdateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: phone,
  role: z.enum(ENUM_ARRAYS.ROLES).optional(),
  status: z.enum(ENUM_ARRAYS.USER_STATUSES).optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
  role: z.enum(ENUM_ARRAYS.ROLES).optional(),
  status: z.enum(ENUM_ARRAYS.USER_STATUSES).optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
