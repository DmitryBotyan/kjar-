import { Router } from "express";
import { getCharacters, getCharacterBySlug, createCharacter, updateCharacter, deleteCharacter } from "../controllers/characters.js";
import { createWork, uploadWorkImage } from "../controllers/works.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { antiSpam } from "../middlewares/antiSpam.js";
import { uploadSingle } from "../middlewares/upload.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateBody, slugSchema } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { z } from "zod";

const router = Router();

const createCharacterSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  role: z.string().min(1),
  status: z.string().min(1),
  field: z.string().optional().nullable(),
  species: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  statsJson: z.any().optional(),
  relationsJson: z.any().optional(),
  tjornId: z.number().int().positive().nullable().optional(),
  favorite: z.string().max(300).optional().nullable(),
  features: z.string().optional().nullable(),
  achievementsJson: z.any().optional(),
});

const updateCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  field: z.string().optional().nullable(),
  species: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  statsJson: z.any().optional(),
  relationsJson: z.any().optional(),
  tjornId: z.number().int().positive().nullable().optional(),
  favorite: z.string().max(300).optional().nullable(),
  features: z.string().optional().nullable(),
  achievementsJson: z.any().optional(),
});

router.get("/", asyncHandler(getCharacters));
router.get("/:slug", asyncHandler(getCharacterBySlug));

// Работы присылают игроки без входа: защита формы и отдельные лимиты
const workLimit = rateLimit(5, 60 * 60 * 1000, "work");
const workUploadLimit = rateLimit(10, 60 * 60 * 1000, "work-upload");

const createWorkSchema = z.object({
  authorName: z.string().trim().min(1).max(100),
  title: z.string().trim().max(200).optional().nullable(),
  image: z.string().url().max(500)
});

router.post("/works/upload", workUploadLimit, uploadSingle("image"), asyncHandler(uploadWorkImage));
router.post(
  "/:slug/works",
  workLimit,
  validateParams(slugSchema),
  antiSpam,
  validateBody(createWorkSchema),
  asyncHandler(createWork)
);

router.post("/", authenticate, requireMinRole("mod"), validateBody(createCharacterSchema), asyncHandler(createCharacter));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updateCharacterSchema), asyncHandler(updateCharacter));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteCharacter));

export default router;
