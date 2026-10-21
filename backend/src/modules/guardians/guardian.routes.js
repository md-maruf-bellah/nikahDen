import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authenticateGuardian } from "../../middleware/guardianAuth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  declareSchema,
  linkExchangeSchema,
  consentSchema,
  verifySchema,
  revokeSchema,
  contactRequestCreateSchema,
  contactDenySchema,
  idParam,
} from "./guardian.validation.js";
import * as guardianController from "./guardian.controller.js";

const router = Router();

// ---------------------------------------------------------------------------
// অভিভাবক (guardian) — consent link রিডিম → guardian-session → consent/verify
// সদস্যের access-token এখানে কাজ করে না (আলাদা সিক্রেট + authenticateGuardian)
// ---------------------------------------------------------------------------
router.post("/session", authLimiter, validate(linkExchangeSchema), guardianController.exchangeLink);
router.post("/consent", authenticateGuardian, validate(consentSchema), guardianController.consent);
router.post("/verify", authenticateGuardian, validate(verifySchema), guardianController.verify);

// ---------------------------------------------------------------------------
// সদস্য (member) — ঘোষণা/পড়া/রিভোক ও contact request নিজ access-token দিয়ে
// ---------------------------------------------------------------------------
router.use(authenticate);

router.get("/mine", guardianController.getMine);
router.post("/declare", validate(declareSchema), guardianController.declare);
router.post("/revoke", validate(revokeSchema), guardianController.revoke);

// গার্ডিয়ান-টু-গার্ডিয়ান contact request — ম্যাচ + উভয় VERIFIED গেটে বাঁধা
router.get("/contact-requests", guardianController.listContactRequests);
router.post("/contact-requests", validate(contactRequestCreateSchema), guardianController.createContactRequest);
router.post("/contact-requests/:id/approve", validate(idParam, "params"), guardianController.approveContactRequest);
router.post("/contact-requests/:id/deny", validate(idParam, "params"), validate(contactDenySchema), guardianController.denyContactRequest);

export default router;
