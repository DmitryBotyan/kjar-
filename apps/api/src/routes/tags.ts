import { Router } from "express";
import { getTags, createTag, updateTag, deleteTag } from "../controllers/tags.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateBody, slugSchema } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { z } from "zod";

const router = Router();

const createTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

// Публичные эндпоинты
router.get("/", asyncHandler(getTags));

// Защищенные эндпоинты (требуют mod/admin)
router.post("/", authenticate, requireMinRole("mod"), validateBody(createTagSchema), asyncHandler(createTag));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updateTagSchema), asyncHandler(updateTag));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteTag));

export default router;
