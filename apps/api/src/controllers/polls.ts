import { Request, Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { polls, pollOptions, pollVotes, posts } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import { AuthRequest } from "../middlewares/auth.js";

/**
 * Получить опрос по ID поста
 */
export async function getPollByPostId(req: Request, res: Response) {
  try {
    const { postId } = req.params;

    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.postId, parseInt(postId)))
      .limit(1);

    if (poll.length === 0) {
      return res.json({ data: null });
    }

    // Получаем варианты ответов
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll[0].id))
      .orderBy(pollOptions.order);

    // Получаем количество голосов для каждого варианта
    const votesCount = await db
      .select({
        optionId: pollVotes.optionId,
        count: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, poll[0].id))
      .groupBy(pollVotes.optionId);

    const votesMap = new Map(
      votesCount.map((v) => [v.optionId, v.count])
    );

    const totalVotes = votesCount.reduce((sum, v) => sum + v.count, 0);

    const optionsWithVotes = options.map((option) => ({
      ...option,
      votes: votesMap.get(option.id) || 0,
      percentage:
        totalVotes > 0 && poll[0].showPercentages
          ? Math.round((votesMap.get(option.id) || 0) / totalVotes * 100)
          : null,
    }));

    res.json({
      data: {
        ...poll[0],
        options: optionsWithVotes,
        totalVotes,
      },
    });
  } catch (error) {
    console.error("Error getting poll:", error);
    throw createError(500, "Ошибка получения опроса");
  }
}

/**
 * Проверить, проголосовал ли пользователь
 */
export async function checkUserVote(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.json({ data: { hasVoted: false, votedOptionId: null } });
    }

    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.postId, parseInt(postId)))
      .limit(1);

    if (poll.length === 0) {
      return res.json({ data: { hasVoted: false, votedOptionId: null } });
    }

    const vote = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, poll[0].id), eq(pollVotes.userId, userId)))
      .limit(1);

    res.json({
      data: {
        hasVoted: vote.length > 0,
        votedOptionId: vote.length > 0 ? vote[0].optionId : null,
      },
    });
  } catch (error) {
    console.error("Error checking user vote:", error);
    throw createError(500, "Ошибка проверки голоса");
  }
}

/**
 * Создать опрос
 */
export async function createPoll(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError(401, "Требуется авторизация");
    }

    const { postId, options, showPercentages, isEnded, allowMultiple } = req.body;

    if (!postId || !Array.isArray(options) || options.length === 0) {
      throw createError(400, "Необходимо указать postId и варианты ответов");
    }

    // Проверяем, что пост существует и это ивент с форматом poll
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (post.length === 0) {
      throw createError(404, "Пост не найден");
    }

    if (!post[0].isEvent || post[0].eventFormat !== "poll") {
      throw createError(400, "Пост должен быть ивентом с форматом 'poll'");
    }

    // Проверяем, что опрос еще не создан
    const existingPoll = await db
      .select()
      .from(polls)
      .where(eq(polls.postId, parseInt(postId)))
      .limit(1);

    if (existingPoll.length > 0) {
      throw createError(400, "Опрос для этого поста уже существует");
    }

    // Создаем опрос
    const [newPoll] = await db
      .insert(polls)
      .values({
        postId: parseInt(postId),
        showPercentages: showPercentages || false,
        isEnded: isEnded || false,
        allowMultiple: allowMultiple || false,
      })
      .returning();

    // Создаем варианты ответов
    const pollOptionsData = options.map((text: string, index: number) => ({
      pollId: newPoll.id,
      text,
      order: index,
    }));

    await db.insert(pollOptions).values(pollOptionsData);

    res.status(201).json({ data: newPoll });
  } catch (error) {
    console.error("Error creating poll:", error);
    if (error instanceof Error && error.message.includes("Ошибка")) {
      throw error;
    }
    throw createError(500, "Ошибка создания опроса");
  }
}

/**
 * Обновить опрос
 */
export async function updatePoll(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError(401, "Требуется авторизация");
    }

    const { postId } = req.params;
    const { showPercentages, isEnded, allowMultiple, options } = req.body;

    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.postId, parseInt(postId)))
      .limit(1);

    if (poll.length === 0) {
      throw createError(404, "Опрос не найден");
    }

    const updateData: any = {};
    if (showPercentages !== undefined) updateData.showPercentages = showPercentages;
    if (isEnded !== undefined) updateData.isEnded = isEnded;
    if (allowMultiple !== undefined) updateData.allowMultiple = allowMultiple;
    updateData.updatedAt = new Date();

    await db
      .update(polls)
      .set(updateData)
      .where(eq(polls.id, poll[0].id));

    // Если переданы новые варианты ответов, обновляем их
    if (Array.isArray(options)) {
      // Удаляем старые варианты
      await db.delete(pollOptions).where(eq(pollOptions.pollId, poll[0].id));

      // Создаем новые
      const pollOptionsData = options.map((text: string, index: number) => ({
        pollId: poll[0].id,
        text,
        order: index,
      }));

      await db.insert(pollOptions).values(pollOptionsData);
    }

    const [updatedPoll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, poll[0].id))
      .limit(1);

    res.json({ data: updatedPoll });
  } catch (error) {
    console.error("Error updating poll:", error);
    if (error instanceof Error && error.message.includes("Ошибка")) {
      throw error;
    }
    throw createError(500, "Ошибка обновления опроса");
  }
}

/**
 * Проголосовать в опросе
 */
export async function votePoll(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError(401, "Требуется авторизация");
    }

    const { postId } = req.params;
    const { optionId } = req.body;

    if (!optionId) {
      throw createError(400, "Необходимо указать optionId");
    }

    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.postId, parseInt(postId)))
      .limit(1);

    if (poll.length === 0) {
      throw createError(404, "Опрос не найден");
    }

    if (poll[0].isEnded) {
      throw createError(400, "Опрос завершен");
    }

    // Проверяем, что вариант ответа существует
    const option = await db
      .select()
      .from(pollOptions)
      .where(and(eq(pollOptions.id, parseInt(optionId)), eq(pollOptions.pollId, poll[0].id)))
      .limit(1);

    if (option.length === 0) {
      throw createError(404, "Вариант ответа не найден");
    }

    // Проверяем, не голосовал ли уже пользователь
    const existingVote = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, poll[0].id), eq(pollVotes.userId, req.user.userId)))
      .limit(1);

    if (existingVote.length > 0 && !poll[0].allowMultiple) {
      throw createError(400, "Вы уже проголосовали в этом опросе");
    }

    // Если allowMultiple = true, удаляем предыдущий голос за другой вариант
    if (existingVote.length > 0 && poll[0].allowMultiple) {
      await db
        .delete(pollVotes)
        .where(and(eq(pollVotes.pollId, poll[0].id), eq(pollVotes.userId, req.user.userId)));
    }

    // Создаем новый голос
    await db.insert(pollVotes).values({
      pollId: poll[0].id,
      optionId: parseInt(optionId),
      userId: req.user.userId,
    });

    // Получаем обновленный опрос с результатами
    const updatedPoll = await db
      .select()
      .from(polls)
      .where(eq(polls.id, poll[0].id))
      .limit(1);

    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll[0].id))
      .orderBy(pollOptions.order);

    const votesCount = await db
      .select({
        optionId: pollVotes.optionId,
        count: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, poll[0].id))
      .groupBy(pollVotes.optionId);

    const votesMap = new Map(
      votesCount.map((v) => [v.optionId, v.count])
    );

    const totalVotes = votesCount.reduce((sum, v) => sum + v.count, 0);

    const optionsWithVotes = options.map((option) => ({
      ...option,
      votes: votesMap.get(option.id) || 0,
      percentage:
        totalVotes > 0 && poll[0].showPercentages
          ? Math.round((votesMap.get(option.id) || 0) / totalVotes * 100)
          : null,
    }));

    res.json({
      data: {
        ...updatedPoll[0],
        options: optionsWithVotes,
        totalVotes,
      },
    });
  } catch (error) {
    console.error("Error voting poll:", error);
    if (error instanceof Error && error.message.includes("Ошибка")) {
      throw error;
    }
    throw createError(500, "Ошибка голосования");
  }
}
