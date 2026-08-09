import { Router } from "express";
import { getCharacters, getCharacterBySlug, createCharacter, updateCharacter, deleteCharacter } from "../controllers/characters.js";
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
});

// Публичные эндпоинты
router.get("/", asyncHandler(getCharacters));
router.get("/:slug", asyncHandler(getCharacterBySlug));

// Защищенные эндпоинты (требуют mod/admin)
router.post("/", authenticate, requireMinRole("mod"), validateBody(createCharacterSchema), asyncHandler(createCharacter));
router.put("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), validateBody(updateCharacterSchema), asyncHandler(updateCharacter));
router.delete("/:slug", authenticate, requireMinRole("mod"), validateParams(slugSchema), asyncHandler(deleteCharacter));

export default router;
