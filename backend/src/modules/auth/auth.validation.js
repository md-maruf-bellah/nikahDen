import { z } from "zod";

const email = z.string().trim().toLowerCase().email("A valid email address is required").max(120);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  email,
  password,
  phone: z
    .string()
    .trim()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number e.g. 017XXXXXXXX")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, "refreshToken is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "token is required"),
  newPassword: password,
});
