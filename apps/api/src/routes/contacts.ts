import { Router } from "express";
import { z } from "zod";
import {
  createContactRequest,
  getContactRequests,
  updateContactRequest,
  deleteContactRequest
} from "../controllers/contacts.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { validateBody } from "../middlewares/validate.js";
import { antiSpam } from "../middlewares/antiSpam.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(200),
  contact: z.string().trim().min(3, "Оставьте способ связи").max(200),
  subject: z.string().trim().min(3, "Коротко обозначьте тему").max(300),
  message: z.string().trim().min(10, "Опишите вопрос подробнее").max(10000)
});

const updateSchema = z.object({
  status: z.enum(["new", "in_progress", "done"])
});

// Форма открыта всем: пять обращений в час с адреса
const contactLimit = rateLimit(5, 60 * 60 * 1000, "contact");

router.post("/", contactLimit, antiSpam, validateBody(createSchema), asyncHandler(createContactRequest));

// Обращения видны только модераторам и админам
router.get("/", authenticate, requireMinRole("mod"), asyncHandler(getContactRequests));
router.patch(
  "/:id",
  authenticate,
  requireMinRole("mod"),
  validateBody(updateSchema),
  asyncHandler(updateContactRequest)
);
router.delete("/:id", authenticate, requireMinRole("mod"), asyncHandler(deleteContactRequest));

export default router;
