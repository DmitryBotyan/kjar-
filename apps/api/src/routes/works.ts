import { Router } from "express";
import { z } from "zod";
import { getAllWorks, updateWorkApproval, deleteWork } from "../controllers/works.js";
import { authenticate } from "../middlewares/auth.js";
import { requireMinRole } from "../middlewares/authorize.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();
const idParams = z.object({ id: z.coerce.number().int().positive() });

router.use(authenticate, requireMinRole("mod"));

router.get("/", asyncHandler(getAllWorks));
router.patch(
  "/:id",
  validateParams(idParams),
  validateBody(z.object({ isApproved: z.boolean() })),
  asyncHandler(updateWorkApproval)
);
router.delete("/:id", validateParams(idParams), asyncHandler(deleteWork));

export default router;
