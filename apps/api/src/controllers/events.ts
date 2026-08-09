import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, isNotNull, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { posts, postTags, tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";

/**
 * Получить список ивентов (постов с isEvent = true)
 */
export async function getEvents(req: Request, res: Response) {
  try {
    const { eventType, eventFormat, participationType, tag, search, limit = "50", offset = "0" } = req.query;

    const conditions = [
      isNotNull(posts.publishedAt),
      eq(posts.isEvent, true) // Только ивенты
    ];

    if (eventType) {
      conditions.push(eq(posts.eventType, eventType as string));
    }

    if (eventFormat) {
      conditions.push(eq(posts.eventFormat, eventFormat as string));
    }

    if (participationType) {
      conditions.push(eq(posts.participationType, participationType as string));
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
        content: posts.content,
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
      "Ошибка при получении ивентов",
      500,
      "FETCH_EVENTS_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Получить ивент по slug
 */
export async function getEventBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const [event] = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.slug, slug),
        eq(posts.isEvent, true)
      ))
      .limit(1);

    if (!event) {
      throw createError("Ивент не найден", 404, "EVENT_NOT_FOUND");
    }

    // Получаем теги
    const eventTagsList = await db
      .select({
        tag: tags
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, event.id));

    res.json({
      data: {
        ...event,
        tags: eventTagsList.map((pt) => pt.tag)
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении ивента",
      500,
      "FETCH_EVENT_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
