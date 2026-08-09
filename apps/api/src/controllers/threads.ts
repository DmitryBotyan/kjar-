import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { threads, threadTags, tags, messages } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";

export async function getThreads(req: Request, res: Response) {
  try {
    const { category, tag, search, limit = "50", offset = "0" } = req.query;

    const conditions = [];

    if (category) {
      conditions.push(eq(threads.category, category as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(threads.title, `%${search}%`),
          ilike(threads.excerpt, `%${search}%`)
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
        const threadIds = await db
          .select({ threadId: threadTags.threadId })
          .from(threadTags)
          .where(eq(threadTags.tagId, tagResult[0].id));

        if (threadIds.length > 0) {
          conditions.push(
            inArray(threads.id, threadIds.map((t) => t.threadId))
          );
        } else {
          return res.json({ data: [], total: 0 });
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: threads.id,
        slug: threads.slug,
        title: threads.title,
        excerpt: threads.excerpt,
        category: threads.category,
        authorName: threads.authorName,
        isLocked: threads.isLocked,
        isPinned: threads.isPinned,
        createdAt: threads.createdAt,
        updatedAt: threads.updatedAt
      })
      .from(threads)
      .where(whereClause)
      .orderBy(desc(threads.isPinned), desc(threads.updatedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Получаем количество сообщений для каждого треда
    const threadIds = results.map((r) => r.id);
    const messageCounts = new Map<number, number>();

    if (threadIds.length > 0) {
      const counts = await db
        .select({
          threadId: messages.threadId,
          count: sql<number>`count(*)`
        })
        .from(messages)
        .where(inArray(messages.threadId, threadIds))
        .groupBy(messages.threadId);

      counts.forEach((c) => {
        messageCounts.set(c.threadId, Number(c.count));
      });
    }

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(threads)
      .where(whereClause);

    const data = results.map((thread) => ({
      ...thread,
      messageCount: messageCounts.get(thread.id) || 0
    }));

    res.json({
      data,
      total: Number(total[0]?.count || 0),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    throw createError(
      "Ошибка при получении обсуждений",
      500,
      "FETCH_THREADS_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getThreadBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const [thread] = await db
      .select()
      .from(threads)
      .where(eq(threads.slug, slug))
      .limit(1);

    if (!thread) {
      throw createError("Обсуждение не найдено", 404, "THREAD_NOT_FOUND");
    }

    // Получаем теги
    const threadTagsList = await db
      .select({
        tag: tags
      })
      .from(threadTags)
      .innerJoin(tags, eq(threadTags.tagId, tags.id))
      .where(eq(threadTags.threadId, thread.id));

    // Получаем сообщения
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, thread.id))
      .orderBy(messages.createdAt);

    res.json({
      data: {
        ...thread,
        tags: threadTagsList.map((tt) => tt.tag),
        messages: threadMessages
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении обсуждения",
      500,
      "FETCH_THREAD_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
