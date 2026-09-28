import { z } from "zod";

const RELIGIONS = ["Islam", "Hinduism", "Christianity", "Buddhism", "Other"];

const nullify = (schema) =>
  schema
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v));

export const preferenceSchema = z
  .object({
    gender: nullify(z.enum(["MALE", "FEMALE"])),
    ageMin: nullify(z.coerce.number().int().min(16).max(90)),
    ageMax: nullify(z.coerce.number().int().min(16).max(90)),
    divisions: z.array(z.string().trim().max(100)).max(8).optional(),
    religion: nullify(z.enum(RELIGIONS)),
    maritalStatuses: z.array(z.enum(["UNMARRIED", "DIVORCED", "WIDOWED", "OTHER"])).max(4).optional(),
    education: z.string().trim().max(100).optional(),
    occupation: z.string().trim().max(100).optional(),
    minMatchScore: z.coerce.number().int().min(0).max(100).optional(),
  })
  .refine((d) => !(d.ageMin != null && d.ageMax != null) || d.ageMin <= d.ageMax, {
    message: "ageMin must be ≤ ageMax",
    path: ["ageMin"],
  });

export const preferenceUpdateSchema = preferenceSchema;
