import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, isNotNull, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { posts, postTags, tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { slugify } from "../utils/slug.js";

export async function getPosts(req: Request, res: Response) {
  try {
    const { tag, search, limit = "50", offset = "0", isEvent } = req.query;

    const conditions = [isNotNull(posts.publishedAt)];

    // Фильтр по типу: пост или ивент
    // По умолчанию исключаем ивенты (показываем только обычные посты)
    if (isEvent !== undefined) {
      const isEventBool = isEvent === "true" || isEvent === "1";
      conditions.push(eq(posts.isEvent, isEventBool));
    } else {
      // Если параметр isEvent не указан, показываем только обычные посты (не ивенты)
      conditions.push(eq(posts.isEvent, false));
    }

    if (search) {
      conditions.push(
        or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.summary, `%${search}%`)
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
        const postIds = await db
          .select({ postId: postTags.postId })
          .from(postTags)
          .where(eq(postTags.tagId, tagResult[0].id));

        if (postIds.length > 0) {
          conditions.push(
            inArray(posts.id, postIds.map((p) => p.postId))
          );
        } else {
          return res.json({ data: [], total: 0 });
        }
      }
    }

    const whereClause = and(...conditions);

    const results = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        summary: posts.summary,
        image: posts.image,
        publishedAt: posts.publishedAt,
        // Поля для ивентов
        isEvent: posts.isEvent,
        eventType: posts.eventType,
        eventFormat: posts.eventFormat,
        participationType: posts.participationType,
        eventStages: posts.eventStages,
        eventConfig: posts.eventConfig,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.publishedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause);

    res.json({
      data: results,
      total: Number(total[0]?.count || 0),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    throw createError(
      "Ошибка при получении постов",
      500,
      "FETCH_POSTS_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getPostBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (!post) {
      throw createError("Пост не найден", 404, "POST_NOT_FOUND");
    }

    // Получаем теги
    const postTagsList = await db
      .select({
        tag: tags
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id));

    res.json({
      data: {
        ...post,
        tags: postTagsList.map((pt) => pt.tag)
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении поста",
      500,
      "FETCH_POST_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const data = req.body as {
      title: string;
      slug?: string;
      summary?: string | null;
      content?: string | null;
      image?: string | null;
      publishedAt?: string | null;
      isEvent?: boolean;
      eventType?: string | null;
      eventFormat?: string | null;
      participationType?: string | null;
    };

    // Генерируем slug если не указан
    let slug = data.slug || slugify(data.title);

    // Проверяем уникальность slug
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      // Добавляем суффикс если slug уже существует
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        slug,
        title: data.title,
        summary: data.summary || null,
        content: data.content || null,
        image: data.image || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        isEvent: data.isEvent || false,
        eventType: data.eventType || null,
        eventFormat: data.eventFormat || null,
        participationType: data.participationType || null,
        createdBy: req.user.id,
      })
      .returning();

    res.status(201).json({ data: newPost });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании поста",
      500,
      "CREATE_POST_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updatePost(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const { slug } = req.params as { slug: string };
    const data = req.body as {
      title?: string;
      slug?: string;
      summary?: string | null;
      content?: string | null;
      image?: string | null;
      publishedAt?: string | null;
      isEvent?: boolean;
      eventType?: string | null;
      eventFormat?: string | null;
      participationType?: string | null;
    };

    // Проверяем существование поста
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Пост не найден", 404, "POST_NOT_FOUND");
    }

    // Если меняется slug, проверяем уникальность
    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, data.slug))
        .limit(1);
      
      if (check.length > 0 && check[0].id !== existing.id) {
        throw createError("Slug уже используется", 400, "SLUG_EXISTS");
      }
    }

    // Если меняется title и slug не указан, генерируем новый slug
    if (data.title && !data.slug) {
      newSlug = slugify(data.title);
      if (newSlug !== existing.slug) {
        const check = await db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          // Добавляем суффикс
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: posts.id })
              .from(posts)
              .where(eq(posts.slug, candidate))
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
      .update(posts)
      .set({
        ...(data.title && { title: data.title }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }),
        ...(data.isEvent !== undefined && { isEvent: data.isEvent }),
        ...(data.eventType !== undefined && { eventType: data.eventType }),
        ...(data.eventFormat !== undefined && { eventFormat: data.eventFormat }),
        ...(data.participationType !== undefined && { participationType: data.participationType }),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении поста",
      500,
      "UPDATE_POST_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deletePost(req: AuthRequest, res: Response) {
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
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Пост не найден", 404, "POST_NOT_FOUND");
    }

    await db.delete(posts).where(eq(posts.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении поста",
      500,
      "DELETE_POST_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
