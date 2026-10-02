import { Router } from "express";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFileByKey,
  getFileInfo,
} from "../controllers/upload.js";
import { uploadSingle, uploadMultiple } from "../middlewares/upload.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

router.use(authenticate);

// Отдельный лимит на загрузку: 30 файлов в час с одного аккаунта
const uploadLimit = rateLimit(30, 60 * 60 * 1000, "upload");

router.post(
  "/single",
  uploadLimit,
  uploadSingle("file"),
  asyncHandler(uploadSingleFile)
);

router.post(
  "/multiple",
  uploadLimit,
  uploadMultiple("files", 10),
  asyncHandler(uploadMultipleFiles)
);

router.get("/:key", requireMinRole("mod"), asyncHandler(getFileInfo));

router.delete("/:key", requireMinRole("mod"), asyncHandler(deleteFileByKey));

export default router;
