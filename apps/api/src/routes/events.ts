import { Router } from "express";
import { getEvents, getEventBySlug } from "../controllers/events.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getEvents));
router.get("/:slug", asyncHandler(getEventBySlug));

export default router;
