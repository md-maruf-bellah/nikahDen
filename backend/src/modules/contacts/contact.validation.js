import { z } from "zod";
import { ENUM_ARRAYS } from "../../constants/index.js";

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().toLowerCase().email("A valid email is required"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  // ---- স্প্যাম প্রতিরোধ (বট-কেন্দ্রিক, মানুষ দেখতেই পায় না) ----
  // honeypot: CSS দিয়ে লুকানো ইনপুট — মানুষ লেখে না, বট অটো-ফিল করে
  website: z.string().max(200).optional().default(""),
  // টাইম-ট্র্যাপ: ফর্ম রেন্ডার হওয়া থেকে সাবমিট — মানুষ কমপক্ষে কয়েক সেকেন্ড নেয়
  formElapsedMs: z.coerce.number().int().min(0).max(24 * 60 * 60 * 1000).optional().default(0),
});

export const idParam = z.object({ id: z.string().min(1) });

export const updateContactSchema = z.object({
  status: z.enum(["REPLIED", "CLOSED", "NEW"]),
  reply: z.string().trim().max(2000).optional().default(""),
});

export const listContactsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(ENUM_ARRAYS.CONTACT_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
});
