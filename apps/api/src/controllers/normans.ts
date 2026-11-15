import type { Request, Response } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { characters, normans } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import { uniqueSlug } from "../utils/slug.js";
import { assertDictionaryValue } from "./dictionaries.js";

type NormanInput = {
  name?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  image?: string | null;
  gender?: string | null;
  occupation?: string | null;
  normanType?: string | null;
  traitsJson?: Record<string, number> | null;
};

async function assertDictionaries(data: NormanInput) {
  await assertDictionaryValue("norman_gender", data.gender, "Пол норманнов");
  await assertDictionaryValue("norman_occupation", data.occupation, "Род деятельности");
  await assertDictionaryValue("norman_type", data.normanType, "Типы норманнов");
}

// Пустую анкету храним как null, чтобы карточка не рисовала пустой блок
function cleanTraits(traits: NormanInput["traitsJson"]) {
  if (!traits) return null;
  const entries = Object.entries(traits).filter(([key]) => key.trim());
  return entries.length ? Object.fromEntries(entries) : null;
}

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

export async function getNormans(req: Request, res: Response) {
  const { search, gender, occupation, type } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (gender) conditions.push(eq(normans.gender, gender));
  if (occupation) conditions.push(eq(normans.occupation, occupation));
  if (type) conditions.push(eq(normans.normanType, type));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(normans.name, pattern),
        ilike(normans.summary, pattern),
        ilike(normans.gender, pattern),
        ilike(normans.occupation, pattern)
      )!
    );
  }

  const rows = await db
    .select({
      id: normans.id,
      slug: normans.slug,
      name: normans.name,
      summary: normans.summary,
      image: normans.image,
      gender: normans.gender,
      occupation: normans.occupation,
      normanType: normans.normanType,
      kjarCount: sql<number>`(select count(*) from "characters" where "characters"."tjorn_id" = "normans"."id")`
    })
    .from(normans)
    .where(conditions.length ? and(...conditions) : undefined)
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
      portrait: characters.portrait,
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
  await assertDictionaries(data);

  const [created] = await db
    .insert(normans)
    .values({
      slug,
      name: data.name.trim(),
      summary: data.summary?.trim() || null,
      description: data.description?.trim() || null,
      image: data.image || null,
      gender: data.gender || null,
      occupation: data.occupation || null,
      normanType: data.normanType || null,
      traitsJson: cleanTraits(data.traitsJson)
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
  await assertDictionaries(data);

  const [updated] = await db
    .update(normans)
    .set({
      slug,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.summary !== undefined && { summary: data.summary?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.image !== undefined && { image: data.image || null }),
      ...(data.gender !== undefined && { gender: data.gender || null }),
      ...(data.occupation !== undefined && { occupation: data.occupation || null }),
      ...(data.normanType !== undefined && { normanType: data.normanType || null }),
      ...(data.traitsJson !== undefined && { traitsJson: cleanTraits(data.traitsJson) }),
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
