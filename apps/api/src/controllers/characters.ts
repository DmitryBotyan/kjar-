import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { characters, characterTags, tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";

export async function getCharacters(req: Request, res: Response) {
  try {
    const { role, status, species, tag, search, limit = "50", offset = "0" } = req.query;

    const conditions = [];

    if (role) {
      conditions.push(eq(characters.role, role as string));
    }

    if (status) {
      conditions.push(eq(characters.status, status as string));
    }

    if (species) {
      conditions.push(eq(characters.species, species as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(characters.name, `%${search}%`),
          ilike(characters.summary, `%${search}%`)
        )!
      );
    }

    if (tag) {
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tag as string))
        .limit(1);

      if (tagResult.length > 0) {
        const characterIds = await db
          .select({ characterId: characterTags.characterId })
          .from(characterTags)
          .where(eq(characterTags.tagId, tagResult[0].id));

        if (characterIds.length > 0) {
          conditions.push(
            inArray(characters.id, characterIds.map((c) => c.characterId))
          );
        } else {
          return res.json({ data: [], total: 0 });
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: characters.id,
        slug: characters.slug,
        name: characters.name,
        role: characters.role,
        status: characters.status,
        field: characters.field,
        species: characters.species,
        summary: characters.summary,
        image: characters.image,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt
      })
      .from(characters)
      .where(whereClause)
      .orderBy(desc(characters.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(whereClause);

    res.json({
      data: results,
      total: Number(total[0]?.count || 0),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    throw createError(
      "Ошибка при получении персонажей",
      500,
      "FETCH_CHARACTERS_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getCharacterBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!character) {
      throw createError("Персонаж не найден", 404, "CHARACTER_NOT_FOUND");
    }

    // Получаем теги
    const characterTagsList = await db
      .select({
        tag: tags
      })
      .from(characterTags)
      .innerJoin(tags, eq(characterTags.tagId, tags.id))
      .where(eq(characterTags.characterId, character.id));

    res.json({
      data: {
        ...character,
        tags: characterTagsList.map((ct) => ct.tag)
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении персонажа",
      500,
      "FETCH_CHARACTER_ERROR",
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

export async function createCharacter(req: AuthRequest, res: Response) {
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
      role: string;
      status: string;
      field?: string | null;
      species?: string | null;
      summary?: string | null;
      description?: string | null;
      image?: string | null;
      statsJson?: any;
      relationsJson?: any;
    };

    // Генерируем slug если не указан
    let slug = data.slug || generateSlug(data.name);

    // Проверяем уникальность slug
    const existing = await db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      // Добавляем суффикс если slug уже существует
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: characters.id })
          .from(characters)
          .where(eq(characters.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newCharacter] = await db
      .insert(characters)
      .values({
        slug,
        name: data.name,
        role: data.role,
        status: data.status,
        field: data.field || null,
        species: data.species || null,
        summary: data.summary || null,
        description: data.description || null,
        image: data.image || null,
        statsJson: data.statsJson || null,
        relationsJson: data.relationsJson || null,
        createdBy: req.user.userId,
      })
      .returning();

    res.status(201).json({ data: newCharacter });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании персонажа",
      500,
      "CREATE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updateCharacter(req: AuthRequest, res: Response) {
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
      role?: string;
      status?: string;
      field?: string | null;
      species?: string | null;
      summary?: string | null;
      description?: string | null;
      image?: string | null;
      statsJson?: any;
      relationsJson?: any;
    };

    // Проверяем существование персонажа
    const [existing] = await db
      .select()
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Персонаж не найден", 404, "CHARACTER_NOT_FOUND");
    }

    // Если меняется slug, проверяем уникальность
    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.slug, data.slug))
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
          .select({ id: characters.id })
          .from(characters)
          .where(eq(characters.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          // Добавляем суффикс
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: characters.id })
              .from(characters)
              .where(eq(characters.slug, candidate))
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
      .update(characters)
      .set({
        ...(data.name && { name: data.name }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.field !== undefined && { field: data.field }),
        ...(data.species !== undefined && { species: data.species }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.statsJson !== undefined && { statsJson: data.statsJson }),
        ...(data.relationsJson !== undefined && { relationsJson: data.relationsJson }),
        updatedAt: new Date(),
      })
      .where(eq(characters.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении персонажа",
      500,
      "UPDATE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deleteCharacter(req: AuthRequest, res: Response) {
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
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Персонаж не найден", 404, "CHARACTER_NOT_FOUND");
    }

    await db.delete(characters).where(eq(characters.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении персонажа",
      500,
      "DELETE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
