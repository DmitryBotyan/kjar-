import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categories.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateBody, slugSchema } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { z } from "zod";

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

// Публичные эндпоинты
router.get("/", asyncHandler(getCategories));

// Защищенные эндпоинты (требуют mod/admin)
router.post("/", authenticate, requireMinRole("mod"), validateBody(createCategorySchema), asyncHandler(createCategory));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updateCategorySchema), asyncHandler(updateCategory));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteCategory));

export default router;
