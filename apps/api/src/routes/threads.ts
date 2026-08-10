import { Router } from "express";
import { z } from "zod";
import {
  getThreads,
  getThreadBySlug,
  createThread,
  createMessage,
  updateThread,
  deleteThread,
  deleteMessage
} from "../controllers/threads.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validate.js";
import { antiSpam } from "../middlewares/antiSpam.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

const createThreadSchema = z.object({
  title: z.string().trim().min(5, "Заголовок от 5 символов").max(500),
  excerpt: z.string().trim().max(500).optional(),
  category: z.string().trim().max(100).optional(),
  authorName: z.string().trim().min(2, "Укажите имя").max(200),
  content: z.string().trim().min(10, "Опишите тему подробнее").max(20000),
  tags: z.array(z.string().trim().min(1).max(100)).max(8).optional()
});

const createMessageSchema = z.object({
  authorName: z.string().trim().min(2, "Укажите имя").max(200),
  content: z.string().trim().min(2, "Напишите ответ").max(20000)
});

const updateThreadSchema = z.object({
  title: z.string().trim().min(5).max(500).optional(),
  excerpt: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  isLocked: z.boolean().optional(),
  isPinned: z.boolean().optional()
});

// Темы и ответы открыты всем, поэтому лимиты жёстче общего
const threadLimit = rateLimit(5, 60 * 60 * 1000, "thread");
const messageLimit = rateLimit(15, 10 * 60 * 1000, "thread-message");

router.get("/", asyncHandler(getThreads));
router.get("/:slug", asyncHandler(getThreadBySlug));

router.post(
  "/",
  threadLimit,
  optionalAuth,
  antiSpam,
  validateBody(createThreadSchema),
  asyncHandler(createThread)
);

router.post(
  "/:slug/messages",
  messageLimit,
  optionalAuth,
  antiSpam,
  validateBody(createMessageSchema),
  asyncHandler(createMessage)
);

// Модерация обсуждений
router.patch(
  "/:slug",
  authenticate,
  requireMinRole("mod"),
  validateBody(updateThreadSchema),
  asyncHandler(updateThread)
);
router.delete("/:slug", authenticate, requireMinRole("mod"), asyncHandler(deleteThread));
router.delete(
  "/messages/:messageId",
  authenticate,
  requireMinRole("mod"),
  asyncHandler(deleteMessage)
);

export default router;
