import type { Request, Response } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { characters, normans } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import { uniqueSlug } from "../utils/slug.js";

type NormanInput = {
  name?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  image?: string | null;
};

async function findBySlug(slug: string) {
  const [norman] = await db.select().from(normans).where(eq(normans.slug, slug)).limit(1);
  if (!norman) {
    throw createError("Тьорн не найден", 404, "NORMAN_NOT_FOUND");
  }
  return norman;
}

async function slugTaken(slug: string, exceptId?: number) {
  const [row] = await db.select({ id: normans.id }).from(normans).where(eq(normans.slug, slug)).limit(1);
  return !!row && row.id !== exceptId;
}

export async function getNormans(_req: Request, res: Response) {
  const rows = await db
    .select({
      id: normans.id,
      slug: normans.slug,
      name: normans.name,
      summary: normans.summary,
      image: normans.image,
      kjarCount: sql<number>`(select count(*) from "characters" where "characters"."tjorn_id" = "normans"."id")`
    })
    .from(normans)
    .orderBy(asc(normans.name));

  res.json({ data: rows.map((row) => ({ ...row, kjarCount: Number(row.kjarCount) })) });
}

export async function getNormanBySlug(req: Request, res: Response) {
  const norman = await findBySlug(req.params.slug);

  const kjars = await db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      species: characters.species,
      summary: characters.summary,
      image: characters.image,
      statsJson: characters.statsJson
    })
    .from(characters)
    .where(eq(characters.tjornId, norman.id))
    .orderBy(desc(characters.createdAt));

  res.json({ data: { ...norman, kjars } });
}

export async function createNorman(req: Request, res: Response) {
  const data = req.body as NormanInput & { name: string };
  const slug = data.slug?.trim()
    ? data.slug.trim()
    : await uniqueSlug(data.name, (candidate) => slugTaken(candidate));

  if (await slugTaken(slug)) {
    throw createError("Slug уже используется", 400, "SLUG_EXISTS");
  }

  const [created] = await db
    .insert(normans)
    .values({
      slug,
      name: data.name.trim(),
      summary: data.summary?.trim() || null,
      description: data.description?.trim() || null,
      image: data.image || null
    })
    .returning();

  res.status(201).json({ data: created });
}

export async function updateNorman(req: Request, res: Response) {
  const existing = await findBySlug(req.params.slug);
  const data = req.body as NormanInput;

  const slug = data.slug?.trim() || existing.slug;
  if (slug !== existing.slug && (await slugTaken(slug, existing.id))) {
    throw createError("Slug уже используется", 400, "SLUG_EXISTS");
  }

  const [updated] = await db
    .update(normans)
    .set({
      slug,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.summary !== undefined && { summary: data.summary?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.image !== undefined && { image: data.image || null }),
      updatedAt: new Date()
    })
    .where(eq(normans.id, existing.id))
    .returning();

  res.json({ data: updated });
}

export async function deleteNorman(req: Request, res: Response) {
  const existing = await findBySlug(req.params.slug);
  await db.delete(normans).where(eq(normans.id, existing.id));
  res.status(204).send();
}
