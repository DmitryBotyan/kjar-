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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET не установлен в переменных окружения");
}

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

    // Проверяем, что пользователь все еще существует
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

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      // Асинхронно загружаем пользователя, но не блокируем запрос
      db.select({
        id: users.id,
        username: users.username,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1)
      .then(([user]) => {
        if (user) {
          req.user = user;
        }
      })
      .catch(() => {
        // Игнорируем ошибки при опциональной аутентификации
      });
    } catch {
      // Игнорируем ошибки при опциональной аутентификации
    }
  }
  
  next();
}
