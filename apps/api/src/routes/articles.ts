import { Router } from "express";
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } from "../controllers/articles.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateQuery, paginationSchema, slugSchema, validateParams, validateBody } from "../middlewares/validate.js";
import { z } from "zod";
import { optionalAuth, authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";

const router = Router();

const articlesQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  era: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional()
});

const createArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  summary: z.string().optional(),
  lead: z.string().optional(),
  contentMd: z.string().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  era: z.enum(["first", "second", "any"]).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  summary: z.string().optional().nullable(),
  lead: z.string().optional().nullable(),
  contentMd: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  era: z.enum(["first", "second", "any"]).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

// Публичные эндпоинты
router.get("/", optionalAuth, validateQuery(articlesQuerySchema), asyncHandler(getArticles));
router.get("/:slug", optionalAuth, validateParams(slugSchema), asyncHandler(getArticleBySlug));

// Защищенные эндпоинты (требуют mod/admin)
router.post("/", authenticate, requireMinRole("mod"), validateBody(createArticleSchema), asyncHandler(createArticle));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updateArticleSchema), asyncHandler(updateArticle));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteArticle));

export default router;
