import { Router } from "express";
import { z } from "zod";
import {
  getNormans,
  getNormanBySlug,
  createNorman,
  updateNorman,
  deleteNorman
} from "../controllers/normans.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody, validateParams, slugSchema } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";

const router = Router();

const normanSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(255).optional(),
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().max(500).optional().nullable()
});

router.get("/", asyncHandler(getNormans));
router.get("/:slug", validateParams(slugSchema), asyncHandler(getNormanBySlug));

router.post("/", authenticate, requireMinRole("mod"), validateBody(normanSchema), asyncHandler(createNorman));
router.put(
  "/:slug",
  authenticate,
  requireMinRole("mod"),
  validateParams(slugSchema),
  validateBody(normanSchema.partial()),
  asyncHandler(updateNorman)
);
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteNorman));

export default router;
