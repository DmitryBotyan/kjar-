import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { threads, threadTags, tags, messages } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { uniqueSlug } from "../utils/slug.js";

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

export async function createThread(req: AuthRequest, res: Response) {
  const { title, excerpt, category, authorName, content, tags: tagNames } = req.body as {
    title: string;
    excerpt?: string;
    category?: string;
    authorName: string;
    content: string;
    tags?: string[];
  };

  const slug = await uniqueSlug(title, async (candidate) => {
    const [taken] = await db
      .select({ id: threads.id })
      .from(threads)
      .where(eq(threads.slug, candidate))
      .limit(1);
    return Boolean(taken);
  });

  const [thread] = await db
    .insert(threads)
    .values({
      slug,
      title: title.trim(),
      excerpt: excerpt?.trim() || content.trim().slice(0, 280),
      category: category?.trim() || null,
      authorId: req.user?.id ?? null,
      authorName: authorName.trim()
    })
    .returning();

  // Теги только из существующих: заводить новые из публичной формы нельзя,
  // иначе справочник быстро зарастёт мусором
  if (tagNames && tagNames.length > 0) {
    const normalized = tagNames.map((name) => name.trim().toLowerCase()).filter(Boolean);

    if (normalized.length > 0) {
      const known = await db
        .select({ id: tags.id })
        .from(tags)
        .where(
          or(
            inArray(sql`lower(${tags.name})`, normalized),
            inArray(sql`lower(${tags.slug})`, normalized)
          )!
        );

      if (known.length > 0) {
        await db
          .insert(threadTags)
          .values(known.map((tag) => ({ threadId: thread.id, tagId: tag.id })));
      }
    }
  }

  // Первое сообщение темы — её текст: так ветка сразу читается целиком
  await db.insert(messages).values({
    threadId: thread.id,
    authorId: req.user?.id ?? null,
    authorName: authorName.trim(),
    role: "Автор темы",
    content: content.trim()
  });

  res.status(201).json({ data: thread });
}

export async function createMessage(req: AuthRequest, res: Response) {
  const { slug } = req.params;
  const { authorName, content } = req.body as {
    authorName: string;
    content: string;
  };

  const [thread] = await db
    .select({ id: threads.id, isLocked: threads.isLocked })
    .from(threads)
    .where(eq(threads.slug, slug))
    .limit(1);

  if (!thread) {
    throw createError("Обсуждение не найдено", 404, "THREAD_NOT_FOUND");
  }

  if (thread.isLocked) {
    throw createError("Тема закрыта для ответов", 403, "THREAD_LOCKED");
  }

  const [message] = await db
    .insert(messages)
    .values({
      threadId: thread.id,
      authorId: req.user?.id ?? null,
      authorName: authorName.trim(),
      role: req.user?.role === "admin" || req.user?.role === "mod" ? "Модератор" : "Участник",
      content: content.trim()
    })
    .returning();

  // Тема поднимается в списке по времени последнего ответа
  await db
    .update(threads)
    .set({ updatedAt: new Date() })
    .where(eq(threads.id, thread.id));

  res.status(201).json({ data: message });
}

export async function updateThread(req: AuthRequest, res: Response) {
  const { slug } = req.params;
  const data = req.body as {
    title?: string;
    excerpt?: string | null;
    category?: string | null;
    isLocked?: boolean;
    isPinned?: boolean;
  };

  const [thread] = await db
    .select({ id: threads.id })
    .from(threads)
    .where(eq(threads.slug, slug))
    .limit(1);

  if (!thread) {
    throw createError("Обсуждение не найдено", 404, "THREAD_NOT_FOUND");
  }

  const [updated] = await db
    .update(threads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(threads.id, thread.id))
    .returning();

  res.json({ data: updated });
}

export async function deleteThread(req: AuthRequest, res: Response) {
  const { slug } = req.params;

  const [deleted] = await db
    .delete(threads)
    .where(eq(threads.slug, slug))
    .returning({ id: threads.id });

  if (!deleted) {
    throw createError("Обсуждение не найдено", 404, "THREAD_NOT_FOUND");
  }

  res.json({ data: { id: deleted.id } });
}

export async function deleteMessage(req: AuthRequest, res: Response) {
  const messageId = Number(req.params.messageId);

  if (!Number.isInteger(messageId)) {
    throw createError("Неверный идентификатор сообщения", 400, "INVALID_ID");
  }

  const [deleted] = await db
    .delete(messages)
    .where(eq(messages.id, messageId))
    .returning({ id: messages.id });

  if (!deleted) {
    throw createError("Сообщение не найдено", 404, "MESSAGE_NOT_FOUND");
  }

  res.json({ data: { id: deleted.id } });
}
