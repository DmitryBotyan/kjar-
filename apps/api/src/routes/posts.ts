import { Router } from "express";
import { getPosts, getPostBySlug, createPost, updatePost, deletePost } from "../controllers/posts.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateBody, slugSchema } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { z } from "zod";

const router = Router();

const createPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  isEvent: z.boolean().optional(),
  eventType: z.string().optional().nullable(),
  eventFormat: z.string().optional().nullable(),
  participationType: z.string().optional().nullable(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  isEvent: z.boolean().optional(),
  eventType: z.string().optional().nullable(),
  eventFormat: z.string().optional().nullable(),
  participationType: z.string().optional().nullable(),
});

// Публичные эндпоинты
router.get("/", asyncHandler(getPosts));
router.get("/:slug", asyncHandler(getPostBySlug));

// Защищенные эндпоинты (требуют mod/admin)
router.post("/", authenticate, requireMinRole("mod"), validateBody(createPostSchema), asyncHandler(createPost));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updatePostSchema), asyncHandler(updatePost));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deletePost));

export default router;
