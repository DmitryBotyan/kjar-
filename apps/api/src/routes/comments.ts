import { Router } from "express";
import { z } from "zod";
import {
  getComments,
  createComment,
  deleteComment,
  uploadCommentImage,
} from "../controllers/comments.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { validateBody } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { uploadSingle } from "../middlewares/upload.js";

const router = Router();

const createCommentSchema = z.object({
  authorName: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  image: z.string().max(500).nullable().optional(),
  parentId: z.union([z.string(), z.number()]).nullable().optional(),
  captchaToken: z.string().min(1), // Заглушка для капчи
});

// Получить комментарии (публичный)
router.get(
  "/:targetType/:targetId",
  asyncHandler(getComments)
);

// Комментарии открыты всем, поэтому лимиты жёстче общего:
// 10 комментариев за 10 минут и 10 картинок в час с одного адреса
const commentLimit = rateLimit(10, 10 * 60 * 1000, "comment");
const commentUploadLimit = rateLimit(10, 60 * 60 * 1000, "comment-upload");

// Создать комментарий (публичный, но требует капчу)
router.post(
  "/:targetType/:targetId",
  commentLimit,
  validateBody(createCommentSchema),
  asyncHandler(createComment)
);

// Загрузить изображение для комментария (публичный)
router.post(
  "/upload",
  commentUploadLimit,
  uploadSingle("image"),
  asyncHandler(uploadCommentImage)
);

// Удалить комментарий (только для модераторов)
router.delete(
  "/:commentId",
  authenticate,
  requireMinRole("mod"),
  asyncHandler(deleteComment)
);

export default router;
