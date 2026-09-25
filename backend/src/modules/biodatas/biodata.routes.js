import { Router } from "express";
import { z } from "zod";
import { authenticate, optionalAuth } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { uploadBiodataPhoto } from "../../middleware/upload.middleware.js";
import { ROLES } from "../../constants/index.js";
import {
  biodataSchema,
  listBiodatasSchema,
  statusSchema,
  similarSchema,
  idParam,
  indexParam,
} from "./biodata.validation.js";
import * as biodataController from "./biodata.controller.js";

const profilePhotoSchema = z.object({ url: z.string().trim().min(1) });

const router = Router();

// ---------------- public directory ----------------
router.get("/", optionalAuth, validate(listBiodatasSchema, "query"), biodataController.list);
router.get("/likes/sent", authenticate, biodataController.likesSent);
router.get("/likes/received", authenticate, biodataController.likesReceived);

// ---------------- own biodata ----------------
router.get("/me", authenticate, biodataController.getMine);
router.post("/", authenticate, validate(biodataSchema), biodataController.createMine);
router.patch("/me", authenticate, validate(biodataSchema), biodataController.updateMine);
router.post("/me/submit", authenticate, biodataController.submitMine);
router.post("/me/restore", authenticate, biodataController.restoreMine);
router.delete("/me", authenticate, biodataController.archiveMine);
router.post("/me/photos", authenticate, uploadBiodataPhoto, biodataController.uploadMinePhoto);

// ---------------- single biodata ----------------
router.get("/:id", optionalAuth, validate(idParam, "params"), biodataController.getOne);
router.get("/:id/similar", optionalAuth, validate(idParam, "params"), validate(similarSchema, "query"), biodataController.similar);

router.post("/:id/like", authenticate, validate(idParam, "params"), biodataController.like);
router.delete("/:id/like", authenticate, validate(idParam, "params"), biodataController.unlike);

// owner / admin photo management
router.delete(
  "/:id/photos/:index",
  authenticate,
  validate(idParam, "params"),
  validate(indexParam, "params"),
  biodataController.removePhoto
);
router.patch(
  "/:id/profile-photo",
  authenticate,
  validate(idParam, "params"),
  validate(profilePhotoSchema),
  biodataController.setPhotoAsProfile
);

// admin moderation
router.patch(
  "/:id/status",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR),
  validate(idParam, "params"),
  validate(statusSchema),
  biodataController.moderate
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPERADMIN),
  validate(idParam, "params"),
  biodataController.adminDelete
);

export default router;
