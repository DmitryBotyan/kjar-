import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users } from "@kjar/db";
import { eq } from "drizzle-orm";
import { createError } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { z } from "zod";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  username: z.string().min(3).max(100).optional(),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов")
});

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен")
});

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password } = registerSchema.parse(req.body);

    // Проверяем, существует ли пользователь
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw createError("Пользователь с таким email уже существует", 409, "USER_EXISTS");
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Создаем пользователя
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username: username || null,
        passwordHash,
        role: "user" // По умолчанию роль "user"
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role
      });

    // Генерируем токен
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при регистрации",
      500,
      "REGISTRATION_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Находим пользователя
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        passwordHash: users.passwordHash
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw createError("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw createError("Неверный email или пароль", 401, "INVALID_CREDENTIALS");
    }

    // Генерируем токен
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при входе",
      500,
      "LOGIN_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    res.json({
      data: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении данных пользователя",
      500,
      "GET_ME_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Экспортируем схемы для использования в роутах
export { registerSchema, loginSchema };
