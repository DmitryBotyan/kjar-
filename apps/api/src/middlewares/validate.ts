import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { createError } from "./errorHandler.js";

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createError(
            "Ошибка валидации параметров запроса",
            400,
            "VALIDATION_ERROR",
            { errors: error.errors }
          )
        );
      } else {
        next(error);
      }
    }
  };
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createError(
            "Ошибка валидации тела запроса",
            400,
            "VALIDATION_ERROR",
            { errors: error.errors }
          )
        );
      } else {
        next(error);
      }
    }
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createError(
            "Ошибка валидации параметров пути",
            400,
            "VALIDATION_ERROR",
            { errors: error.errors }
          )
        );
      } else {
        next(error);
      }
    }
  };
}

// Схемы валидации для общих параметров
export const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).default("50"),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).default("0")
});

export const slugSchema = z.object({
  slug: z.string().min(1).max(255)
});
