import { Router } from "express";
import { z } from "zod";
import {
  DICTIONARY_GROUPS,
  createDictionaryEntry,
  deleteDictionaryEntry,
  getAllDictionaries,
  getDictionaries,
  updateDictionaryEntry
} from "../controllers/dictionaries.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";

const router = Router();

const idSchema = z.object({
  id: z.string().regex(/^\d+$/)
});

const createSchema = z.object({
  group: z.enum(DICTIONARY_GROUPS),
  code: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

// Код значения не редактируется: он записан в контентных таблицах
const updateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

router.get("/", asyncHandler(getDictionaries));

router.get(
  "/all",
  authenticate,
  requireMinRole("mod"),
  asyncHandler(getAllDictionaries)
);

router.post(
  "/",
  authenticate,
  requireMinRole("mod"),
  validateBody(createSchema),
  asyncHandler(createDictionaryEntry)
);

router.put(
  "/:id",
  authenticate,
  requireMinRole("mod"),
  validateParams(idSchema),
  validateBody(updateSchema),
  asyncHandler(updateDictionaryEntry)
);

router.delete(
  "/:id",
  authenticate,
  requireMinRole("mod"),
  validateParams(idSchema),
  asyncHandler(deleteDictionaryEntry)
);

export default router;
