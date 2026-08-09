import { Request, Response } from "express";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { comments } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";

/**
 * Получить комментарии для сущности
 */
export async function getComments(req: Request, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!["post", "event", "article"].includes(targetType)) {
      throw createError("Неверный тип сущности", 400);
    }

    // Получаем только корневые комментарии (без parentId)
    const rootComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.targetType, targetType),
          eq(comments.targetId, parseInt(targetId)),
          eq(comments.isApproved, true),
          isNull(comments.parentId)
        )
      )
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    // Получаем все ответы для этих комментариев
    const commentIds = rootComments.map((c) => c.id);
    let replies: typeof rootComments = [];
    
    if (commentIds.length > 0) {
      replies = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.targetType, targetType),
            eq(comments.targetId, parseInt(targetId)),
            eq(comments.isApproved, true),
            sql`${comments.parentId} IN (${sql.join(commentIds.map(id => sql`${id}`), sql`, `)})`
          )
        )
        .orderBy(comments.createdAt);
    }

    // Группируем ответы по родительским комментариям
    const repliesMap = new Map<number, typeof replies>();
    for (const reply of replies) {
      if (reply.parentId) {
        const existing = repliesMap.get(reply.parentId) || [];
        existing.push(reply);
        repliesMap.set(reply.parentId, existing);
      }
    }

    // Формируем результат с вложенными ответами
    const commentsWithReplies = rootComments.map((comment) => ({
      ...comment,
      replies: repliesMap.get(comment.id) || [],
    }));

    // Получаем общее количество
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(
        and(
          eq(comments.targetType, targetType),
          eq(comments.targetId, parseInt(targetId)),
          eq(comments.isApproved, true),
          isNull(comments.parentId)
        )
      );

    res.json({
      data: commentsWithReplies,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error getting comments:", error);
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка получения комментариев", 500);
  }
}

/**
 * Создать комментарий
 */
export async function createComment(req: Request, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    const { authorName, content, image, parentId, captchaToken } = req.body;

    if (!["post", "event", "article"].includes(targetType)) {
      throw createError("Неверный тип сущности", 400);
    }

    if (!authorName || authorName.trim().length === 0) {
      throw createError("Укажите имя", 400);
    }

    if (authorName.trim().length > 100) {
      throw createError("Имя слишком длинное (максимум 100 символов)", 400);
    }

    if (!content || content.trim().length === 0) {
      throw createError("Укажите текст комментария", 400);
    }

    if (content.trim().length > 5000) {
      throw createError("Комментарий слишком длинный (максимум 5000 символов)", 400);
    }

    // Заглушка для капчи - в будущем заменить на реальную проверку
    // Сейчас просто проверяем, что токен передан
    if (!captchaToken) {
      throw createError("Подтвердите, что вы не робот", 400);
    }

    // Проверяем, существует ли родительский комментарий (если указан)
    if (parentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.id, parseInt(parentId)),
            eq(comments.targetType, targetType),
            eq(comments.targetId, parseInt(targetId))
          )
        )
        .limit(1);

      if (parentComment.length === 0) {
        throw createError("Родительский комментарий не найден", 404);
      }

      // Не разрешаем вложенность больше 1 уровня
      if (parentComment[0].parentId !== null) {
        throw createError("Нельзя отвечать на ответ", 400);
      }
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        targetType,
        targetId: parseInt(targetId),
        authorName: authorName.trim(),
        content: content.trim(),
        image: image || null,
        parentId: parentId ? parseInt(parentId) : null,
        isApproved: true, // По умолчанию одобряем (можно изменить на модерацию)
      })
      .returning();

    res.status(201).json({
      data: {
        ...newComment,
        replies: [],
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка создания комментария", 500);
  }
}

/**
 * Удалить комментарий (только для модераторов)
 */
export async function deleteComment(req: Request, res: Response) {
  try {
    const { commentId } = req.params;

    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(commentId)))
      .limit(1);

    if (comment.length === 0) {
      throw createError("Комментарий не найден", 404);
    }

    await db.delete(comments).where(eq(comments.id, parseInt(commentId)));

    res.json({
      data: { message: "Комментарий удален" },
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка удаления комментария", 500);
  }
}

/**
 * Загрузить изображение для комментария
 */
export async function uploadCommentImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      throw createError("Файл не был загружен", 400);
    }

    // Импортируем функцию загрузки из storage
    const { uploadFile } = await import("../storage/s3.js");
    const result = await uploadFile(req.file, "comments");

    res.json({
      data: {
        ...result,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    console.error("Error uploading comment image:", error);
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка загрузки изображения", 500);
  }
}
