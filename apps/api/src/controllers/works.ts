import type { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { characters, characterWorks } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import { getPublicUrl, uploadFile } from "../storage/s3.js";

const WORKS_FOLDER = "works";

export async function uploadWorkImage(req: Request, res: Response) {
  if (!req.file) {
    throw createError("Файл не был загружен", 400, "NO_FILE_UPLOADED");
  }
  if (!req.file.mimetype.startsWith("image/") || req.file.mimetype === "image/svg+xml") {
    throw createError("Работа должна быть картинкой: JPG, PNG, GIF или WebP", 400, "INVALID_FILE_TYPE");
  }

  const result = await uploadFile(req.file, WORKS_FOLDER);
  res.json({ data: { url: result.url } });
}

export async function createWork(req: Request, res: Response) {
  const { slug } = req.params;
  const { authorName, title, image } = req.body as {
    authorName: string;
    title?: string | null;
    image: string;
  };

  // Картинка должна лежать в нашем хранилище: иначе в работы можно
  // подсунуть ссылку на что угодно в интернете
  if (!image.startsWith(getPublicUrl(`${WORKS_FOLDER}/`))) {
    throw createError("Сначала загрузите картинку", 400, "WORK_IMAGE_INVALID");
  }

  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.slug, slug))
    .limit(1);

  if (!character) {
    throw createError("Кьяр не найден", 404, "CHARACTER_NOT_FOUND");
  }

  const [work] = await db
    .insert(characterWorks)
    .values({
      characterId: character.id,
      authorName: authorName.trim(),
      title: title?.trim() || null,
      image
    })
    .returning({ id: characterWorks.id });

  res.status(201).json({ data: { id: work.id, isApproved: false } });
}

export async function getAllWorks(req: Request, res: Response) {
  const approved = req.query.approved as string | undefined;

  const rows = await db
    .select({
      id: characterWorks.id,
      authorName: characterWorks.authorName,
      title: characterWorks.title,
      image: characterWorks.image,
      isApproved: characterWorks.isApproved,
      createdAt: characterWorks.createdAt,
      characterName: characters.name,
      characterSlug: characters.slug
    })
    .from(characterWorks)
    .innerJoin(characters, eq(characterWorks.characterId, characters.id))
    .where(
      approved === "true" || approved === "false"
        ? eq(characterWorks.isApproved, approved === "true")
        : undefined
    )
    .orderBy(desc(characterWorks.createdAt))
    .limit(200);

  res.json({ data: rows });
}

export async function updateWorkApproval(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { isApproved } = req.body as { isApproved: boolean };

  const [updated] = await db
    .update(characterWorks)
    .set({ isApproved })
    .where(eq(characterWorks.id, id))
    .returning({ id: characterWorks.id, isApproved: characterWorks.isApproved });

  if (!updated) {
    throw createError("Работа не найдена", 404, "WORK_NOT_FOUND");
  }
  res.json({ data: updated });
}

export async function deleteWork(req: Request, res: Response) {
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(characterWorks)
    .where(eq(characterWorks.id, id))
    .returning({ id: characterWorks.id });

  if (!deleted) {
    throw createError("Работа не найдена", 404, "WORK_NOT_FOUND");
  }
  res.status(204).send();
}
