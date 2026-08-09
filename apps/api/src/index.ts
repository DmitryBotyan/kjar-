import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

// Безопасность: ограничиваем размер тела запроса
// Картинки уходят через multipart, поэтому JSON держим маленьким
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));


// CORS с безопасными настройками
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Безопасность: заголовки. X-XSS-Protection убран, он устарел и в современных
// браузерах сам по себе создаёт проблемы; вместо него CSP.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Маршрут ${req.method} ${req.path} не найден`,
      details: {}
    }
  });
});

app.use(errorHandler);

app.listen(port);
