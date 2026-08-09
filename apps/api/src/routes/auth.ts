import { Router } from "express";
import { register, login, getMe, registerSchema, loginSchema } from "../controllers/auth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

// Подбор пароля и накрутка аккаунтов: 10 попыток за 15 минут с адреса
const authLimit = rateLimit(10, 15 * 60 * 1000, "auth");

router.post("/register", authLimit, validateBody(registerSchema), asyncHandler(register));
router.post("/login", authLimit, validateBody(loginSchema), asyncHandler(login));
router.get("/me", authenticate, asyncHandler(getMe));

export default router;
