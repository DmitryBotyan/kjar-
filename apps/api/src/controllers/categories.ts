import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";

export async function getCategories(_req: Request, res: Response) {
  try {
    const results = await db.select().from(categories).orderBy(categories.name);

    res.json({ data: results });
  } catch (error) {
    throw createError(
      "Ошибка при получении категорий",
      500,
      "FETCH_CATEGORIES_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Функция для генерации slug из строки
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const data = req.body as {
      name: string;
      slug?: string;
      description?: string | null;
    };

    // Генерируем slug если не указан
    let slug = data.slug || generateSlug(data.name);

    // Проверяем уникальность slug
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      // Добавляем суффикс если slug уже существует
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        slug,
        name: data.name,
        description: data.description || null,
      })
      .returning();

    res.status(201).json({ data: newCategory });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании категории",
      500,
      "CREATE_CATEGORY_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updateCategory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const { slug } = req.params as { slug: string };
    const data = req.body as {
      name?: string;
      slug?: string;
      description?: string | null;
    };

    // Проверяем существование категории
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Категория не найдена", 404, "CATEGORY_NOT_FOUND");
    }

    // Если меняется slug, проверяем уникальность
    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, data.slug))
        .limit(1);
      
      if (check.length > 0 && check[0].id !== existing.id) {
        throw createError("Slug уже используется", 400, "SLUG_EXISTS");
      }
    }

    // Если меняется name и slug не указан, генерируем новый slug
    if (data.name && !data.slug) {
      newSlug = generateSlug(data.name);
      if (newSlug !== existing.slug) {
        const check = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          // Добавляем суффикс
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: categories.id })
              .from(categories)
              .where(eq(categories.slug, candidate))
              .limit(1);
            if (check2.length === 0 || check2[0].id === existing.id) {
              newSlug = candidate;
              break;
            }
            counter++;
            candidate = `${newSlug}-${counter}`;
          }
        }
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...(data.name && { name: data.name }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        ...(data.description !== undefined && { description: data.description }),
      })
      .where(eq(categories.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении категории",
      500,
      "UPDATE_CATEGORY_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const { slug } = req.params as { slug: string };

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Категория не найдена", 404, "CATEGORY_NOT_FOUND");
    }

    await db.delete(categories).where(eq(categories.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении категории",
      500,
      "DELETE_CATEGORY_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
