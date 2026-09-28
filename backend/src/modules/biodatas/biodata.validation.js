import { z } from "zod";
import {
  ENUM_ARRAYS,
  RELIGIONS,
  MARITAL_STATUSES,
} from "../../constants/index.js";

export const idParam = z.object({ id: z.string().min(1) });
// Combined for routes with both params — validate() replaces req.params, so a
// second validate() on the same source would drop `id`.
export const photoIndexParams = z.object({
  id: z.string().min(1),
  index: z.coerce.number().int().min(0),
});

const bdMobile = z
  .string()
  .trim()
  .regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number e.g. 017XXXXXXXX")
  .optional()
  .or(z.literal(""));

const bdDistrict = z.string().trim().max(100).optional();
const optionalStr = z.string().trim().max(2000).optional();
const shortStr = z.string().trim().max(300).optional();

export const biodataSchema = z.object({
  gender: z.enum(ENUM_ARRAYS.GENDERS).optional(),
  maritalStatus: z.enum(ENUM_ARRAYS.MARITAL_STATUSES).optional(),
  religion: z.enum(ENUM_ARRAYS.RELIGIONS).nullable().optional(),
  sectOrDenomination: shortStr,
  division: bdDistrict,
  district: bdDistrict,
  thana: shortStr,

  firstName: shortStr,
  lastName: shortStr,
  dateOfBirth: z.coerce.date().nullable().optional(),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear()).nullable().optional(),
  heightText: shortStr,
  heightCm: z.coerce.number().int().min(100).max(230).nullable().optional(),
  weightKg: z.coerce.number().int().min(20).max(300).nullable().optional(),
  skinColor: shortStr,
  bloodGroup: shortStr,
  nationality: shortStr,
  nidNumber: shortStr,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),

  // step 1
  clothingStyle: shortStr,
  healthCondition: shortStr,
  entertainmentHabit: shortStr,
  politicalView: shortStr,
  favoriteBooksPeople: shortStr,
  aboutYourself: z.string().trim().max(5000).optional(),
  specialCategories: z.string().trim().max(1000).optional(),

  // step 2
  religiousPracticeLevel: z.enum([
    "Very Practicing",
    "Practicing",
    "Moderate",
    "Occasional",
  ]).nullable().optional(),
  placeOfWorshipAttendance: shortStr,
  holyBookReading: shortStr,
  religiousEducation: shortStr,
  religiousDressPreference: shortStr,
  charityActivity: shortStr,
  religiousOrganization: shortStr,
  dietaryPractice: shortStr,
  futureReligiousGoal: optionalStr,
  partnerReligiousExpectation: optionalStr,

  // step 3
  education: shortStr,
  degree: shortStr,
  institution: shortStr,
  board: shortStr,
  subject: shortStr,
  result: shortStr,
  passingYear: shortStr,
  deeniEducation: shortStr,

  // step 4
  occupation: shortStr,
  occupationDetails: z.string().trim().max(2000).optional(),
  monthlyIncome: z.coerce.number().int().min(0).nullable().optional(),
  company: shortStr,
  experienceYears: shortStr,

  // step 5
  fatherName: shortStr,
  fatherOccupation: shortStr,
  motherName: shortStr,
  motherOccupation: shortStr,
  siblings: shortStr,

  // step 6
  phoneNumber: bdMobile,
  mobile: bdMobile,
  fatherMobile: bdMobile,
  presentAddress: optionalStr,
  permanentAddress: optionalStr,

  // step 7
  agreed: z.boolean().optional(),

  profileImage: z.string().trim().max(500).nullable().optional(),
});

export const listBiodatasSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(120).optional(),
  gender: z.enum(ENUM_ARRAYS.GENDERS).optional(),
  religion: z.enum(ENUM_ARRAYS.RELIGIONS).optional(),
  maritalStatus: z.enum(ENUM_ARRAYS.MARITAL_STATUSES).optional(),
  division: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  education: z.string().trim().max(200).optional(),
  occupation: z.string().trim().max(200).optional(),
  skinColor: z.string().trim().max(100).optional(),
  ageMin: z.coerce.number().int().min(16).max(90).optional(),
  ageMax: z.coerce.number().int().min(16).max(90).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "age", "fullName", "viewCount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  // staff only:
  status: z.enum(ENUM_ARRAYS.BIODATA_STATUSES).optional(),
  all: z.enum(["1", "true", "0", "false"]).optional(),
});

export const statusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "HIDDEN"]),
  rejectionReason: z.string().trim().max(1000).optional().default(""),
});

export const similarSchema = z.object({ limit: z.coerce.number().int().min(1).max(20).optional() });

export { RELIGIONS, MARITAL_STATUSES };
