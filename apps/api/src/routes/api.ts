import { Router } from "express";
import { getRoot } from "../controllers/root.js";
import articlesRouter from "./articles.js";
import charactersRouter from "./characters.js";
import postsRouter from "./posts.js";
import eventsRouter from "./events.js";
import threadsRouter from "./threads.js";
import categoriesRouter from "./categories.js";
import tagsRouter from "./tags.js";
import authRouter from "./auth.js";
import uploadRouter from "./upload.js";
import pollsRouter from "./polls.js";
import commentsRouter from "./comments.js";
import contactsRouter from "./contacts.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { issueFormToken } from "../middlewares/antiSpam.js";

const router = Router();

// Rate limiting для всех эндпоинтов
router.use(rateLimit());

router.get("/", getRoot);
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Токен для публичных форм: подтверждает, что форму открывали в браузере
router.get("/form-token", (_req, res) => {
  res.json({ data: { formToken: issueFormToken() } });
});

// Публичные эндпоинты (не требуют аутентификации)
router.use("/auth", authRouter);
router.use("/articles", articlesRouter);
router.use("/characters", charactersRouter);
router.use("/posts", postsRouter);
router.use("/events", eventsRouter);
router.use("/threads", threadsRouter);
router.use("/categories", categoriesRouter);
router.use("/tags", tagsRouter);
router.use("/upload", uploadRouter);
router.use("/polls", pollsRouter);
router.use("/comments", commentsRouter);
router.use("/contacts", contactsRouter);

export default router;
