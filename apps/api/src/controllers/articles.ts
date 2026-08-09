import type { Response } from "express";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { articles, categories, articleTags, tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { validateQuery, paginationSchema, slugSchema } from "../middlewares/validate.js";
import { z } from "zod";

// Функция для генерации slug из строки
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const articlesQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  era: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional()
});

export async function getArticles(req: AuthRequest, res: Response) {
  try {
    const { category, status, era, tag, search, limit, offset } = req.query as z.infer<typeof articlesQuerySchema>;

    const conditions = [];

    if (category) {
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category as string))
        .limit(1);

      if (categoryResult.length > 0) {
        conditions.push(eq(articles.categoryId, categoryResult[0].id));
      }
    }

    // Защита: только авторизованные пользователи с правами mod/admin могут видеть draft
    if (status) {
      if (status === "draft" && (!req.user || !["mod", "admin"].includes(req.user.role))) {
        throw createError("Недостаточно прав для просмотра черновиков", 403, "FORBIDDEN");
      }
      conditions.push(eq(articles.status, status));
    } else {
      // По умолчанию показываем только опубликованные
      // Если пользователь авторизован как mod/admin, он может видеть все статусы через явный параметр
      conditions.push(eq(articles.status, "published"));
    }

    if (era) {
      conditions.push(eq(articles.era, era as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.summary, `%${search}%`)
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
        const articleIds = await db
          .select({ articleId: articleTags.articleId })
          .from(articleTags)
          .where(eq(articleTags.tagId, tagResult[0].id));

        if (articleIds.length > 0) {
          conditions.push(
            inArray(articles.id, articleIds.map((a) => a.articleId))
          );
        } else {
          // Если нет статей с таким тегом, возвращаем пустой результат
          return res.json({ data: [], total: 0 });
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        lead: articles.lead,
        categoryId: articles.categoryId,
        era: articles.era,
        status: articles.status,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt
      })
      .from(articles)
      .where(whereClause)
      .orderBy(desc(articles.updatedAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(whereClause);

    // Получаем категории для статей
    const categoryIds = [...new Set(results.map((r) => r.categoryId).filter(Boolean))];
    const categoriesMap = new Map();
    if (categoryIds.length > 0) {
      const categoriesList = await db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      categoriesList.forEach((cat) => {
        categoriesMap.set(cat.id, cat);
      });
    }

    const data = results.map((article) => ({
      ...article,
      category: article.categoryId ? categoriesMap.get(article.categoryId) : null
    }));

    res.json({
      data,
      total: Number(total[0]?.count || 0),
      limit,
      offset
    });
  } catch (error) {
    throw createError(
      "Ошибка при получении статей",
      500,
      "FETCH_ARTICLES_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getArticleBySlug(req: AuthRequest, res: Response) {
  try {
    // Параметры уже валидированы middleware
    const { slug } = req.params as { slug: string };

    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!article) {
      throw createError("Статья не найдена", 404, "ARTICLE_NOT_FOUND");
    }

    // Защита: draft статьи доступны только mod/admin
    if (article.status === "draft" && (!req.user || !["mod", "admin"].includes(req.user.role))) {
      throw createError("Статья не найдена", 404, "ARTICLE_NOT_FOUND");
    }

    // Получаем категорию
    let category = null;
    if (article.categoryId) {
      [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, article.categoryId))
        .limit(1);
    }

    // Получаем теги
    const articleTagsList = await db
      .select({
        tag: tags
      })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, article.id));

    res.json({
      data: {
        ...article,
        category,
        tags: articleTagsList.map((at) => at.tag)
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении статьи",
      500,
      "FETCH_ARTICLE_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function createArticle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    // Данные уже валидированы middleware
    const data = req.body as {
      title: string;
      slug?: string;
      summary?: string;
      lead?: string;
      contentMd?: string;
      categoryId?: number | null;
      era?: "first" | "second" | "any" | null;
      status?: "draft" | "published" | "archived";
    };
    
    // Генерируем slug если не указан
    let slug = data.slug || generateSlug(data.title);
    
    // Проверяем уникальность slug
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      // Добавляем суффикс если slug уже существует
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newArticle] = await db
      .insert(articles)
      .values({
        title: data.title,
        slug,
        summary: data.summary || null,
        lead: data.lead || null,
        contentMd: data.contentMd || null,
        categoryId: data.categoryId || null,
        era: data.era || null,
        status: data.status,
        createdBy: req.user.id,
      })
      .returning();

    res.status(201).json({ data: newArticle });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании статьи",
      500,
      "CREATE_ARTICLE_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updateArticle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const { slug } = req.params as { slug: string };
    // Данные уже валидированы middleware
    const data = req.body as {
      title?: string;
      slug?: string;
      summary?: string | null;
      lead?: string | null;
      contentMd?: string | null;
      categoryId?: number | null;
      era?: "first" | "second" | "any" | null;
      status?: "draft" | "published" | "archived";
    };

    // Проверяем существование статьи
    const [existing] = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Статья не найдена", 404, "ARTICLE_NOT_FOUND");
    }

    // Если меняется slug, проверяем уникальность
    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.slug, data.slug))
        .limit(1);
      
      if (check.length > 0 && check[0].id !== existing.id) {
        throw createError("Slug уже используется", 400, "SLUG_EXISTS");
      }
    }

    // Если меняется title и slug не указан, генерируем новый slug
    if (data.title && !data.slug) {
      newSlug = generateSlug(data.title);
      if (newSlug !== existing.slug) {
        const check = await db
          .select({ id: articles.id })
          .from(articles)
          .where(eq(articles.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          // Добавляем суффикс
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: articles.id })
              .from(articles)
              .where(eq(articles.slug, candidate))
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
      .update(articles)
      .set({
        ...(data.title && { title: data.title }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.lead !== undefined && { lead: data.lead }),
        ...(data.contentMd !== undefined && { contentMd: data.contentMd }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.era !== undefined && { era: data.era }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(articles.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении статьи",
      500,
      "UPDATE_ARTICLE_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deleteArticle(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    // Параметры уже валидированы middleware
    const { slug } = req.params as { slug: string };

    const [existing] = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Статья не найдена", 404, "ARTICLE_NOT_FOUND");
    }

    await db.delete(articles).where(eq(articles.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении статьи",
      500,
      "DELETE_ARTICLE_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
