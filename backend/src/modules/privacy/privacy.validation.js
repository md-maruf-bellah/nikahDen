import { z } from "zod";
import { CONTACT_VISIBILITY, PHOTO_VISIBILITY } from "../../constants/index.js";

export const privacySchema = z
  .object({
    photoVisibility: z.enum(Object.values(PHOTO_VISIBILITY)).optional(),
    contactVisibility: z.enum(Object.values(CONTACT_VISIBILITY)).optional(),
    allowCrossReligion: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.photoVisibility !== undefined ||
      v.contactVisibility !== undefined ||
      v.allowCrossReligion !== undefined,
    {
      message: "Provide photoVisibility, contactVisibility, and/or allowCrossReligion.",
    }
  );

export default { privacySchema };
