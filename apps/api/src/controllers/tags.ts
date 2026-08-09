import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";

export async function getTags(_req: Request, res: Response) {
  try {
    const results = await db.select().from(tags).orderBy(tags.name);

    res.json({ data: results });
  } catch (error) {
    throw createError(
      "Ошибка при получении тегов",
      500,
      "FETCH_TAGS_ERROR",
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

export async function createTag(req: AuthRequest, res: Response) {
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
    };

    // Генерируем slug если не указан
    let slug = data.slug || generateSlug(data.name);

    // Проверяем уникальность slug
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      // Добавляем суффикс если slug уже существует
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        slug,
        name: data.name,
      })
      .returning();

    res.status(201).json({ data: newTag });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании тега",
      500,
      "CREATE_TAG_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updateTag(req: AuthRequest, res: Response) {
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
    };

    // Проверяем существование тега
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Тег не найден", 404, "TAG_NOT_FOUND");
    }

    // Если меняется slug, проверяем уникальность
    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, data.slug))
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
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          // Добавляем суффикс
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: tags.id })
              .from(tags)
              .where(eq(tags.slug, candidate))
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
      .update(tags)
      .set({
        ...(data.name && { name: data.name }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        updatedAt: new Date(),
      })
      .where(eq(tags.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении тега",
      500,
      "UPDATE_TAG_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deleteTag(req: AuthRequest, res: Response) {
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
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Тег не найден", 404, "TAG_NOT_FOUND");
    }

    await db.delete(tags).where(eq(tags.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении тега",
      500,
      "DELETE_TAG_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
