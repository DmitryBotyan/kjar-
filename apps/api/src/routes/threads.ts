import { Router } from "express";
import { getThreads, getThreadBySlug } from "../controllers/threads.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getThreads));
router.get("/:slug", asyncHandler(getThreadBySlug));

export default router;
