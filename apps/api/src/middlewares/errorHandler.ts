import type { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = "statusCode" in err && err.statusCode ? err.statusCode : 500;
  const code = "code" in err && err.code ? err.code : "INTERNAL_ERROR";
  const isServerFault = statusCode >= 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Текст ошибки и details содержат внутренности (SQL, пути, стек драйвера).
  // В проде наружу уходит только код и общая фраза, подробности пишем в лог.
  if (isServerFault) {
    console.error("[API]", code, err.message, "details" in err ? err.details : "");
  }

  const message =
    isProduction && isServerFault
      ? "Внутренняя ошибка сервера"
      : err.message || "Внутренняя ошибка сервера";

  const details =
    isProduction && isServerFault
      ? {}
      : "details" in err && err.details
        ? err.details
        : {};

  res.status(statusCode).json({
    error: {
      code,
      message,
      details
    }
  });
}

export function createError(
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_ERROR",
  details?: Record<string, unknown>
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}
