import { Router } from "express";
import { z } from "zod";
import {
  getPollByPostId,
  checkUserVote,
  createPoll,
  updatePoll,
  votePoll,
} from "../controllers/polls.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

const createPollSchema = z.object({
  postId: z.number().int().positive(),
  options: z.array(z.string().min(1)).min(2),
  showPercentages: z.boolean().optional(),
  isEnded: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
});

const updatePollSchema = z.object({
  showPercentages: z.boolean().optional(),
  isEnded: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  options: z.array(z.string().min(1)).optional(),
});

const votePollSchema = z.object({
  optionId: z.number().int().positive(),
  voterKey: z.string().min(16).max(64).optional(),
});

// Получить опрос по ID поста
router.get("/post/:postId", asyncHandler(getPollByPostId));

// Проверить, проголосовал ли пользователь
router.get("/post/:postId/vote", optionalAuth, asyncHandler(checkUserVote));

// Создать опрос (только для модераторов)
router.post(
  "/",
  authenticate,
  requireMinRole("mod"),
  validateBody(createPollSchema),
  asyncHandler(createPoll)
);

// Обновить опрос (только для модераторов)
router.put(
  "/post/:postId",
  authenticate,
  requireMinRole("mod"),
  validateBody(updatePollSchema),
  asyncHandler(updatePoll)
);

// Проголосовать в опросе: открыто всем, лимит от накрутки
router.post(
  "/post/:postId/vote",
  rateLimit(30, 60 * 60 * 1000, "poll-vote"),
  optionalAuth,
  validateBody(votePollSchema),
  asyncHandler(votePoll)
);

export default router;
