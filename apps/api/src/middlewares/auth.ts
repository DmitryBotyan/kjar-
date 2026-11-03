import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "@kjar/db";
import { eq } from "drizzle-orm";
import { createError } from "./errorHandler.js";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET не установлен в переменных окружения");
}

const JWT_SECRET: string = process.env.JWT_SECRET;

export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("Токен не предоставлен", 401, "UNAUTHORIZED");
    }

    const token = authHeader.substring(7);
    
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    } catch (err) {
      throw createError("Недействительный токен", 401, "INVALID_TOKEN");
    }

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      throw createError("Пользователь не найден", 401, "USER_NOT_FOUND");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      next(error);
    } else {
      next(createError("Ошибка аутентификации", 401, "AUTH_ERROR"));
    }
  }
}

// Гость тоже проходит дальше: неверный токен или сбой базы просто оставляют
// запрос анонимным. Пользователя ждём до next(), иначе обработчик его не увидит
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as jwt.JwtPayload;
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          role: users.role
        })
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);
      if (user) {
        req.user = user;
      }
    } catch {
      req.user = undefined;
    }
  }
  next();
}
