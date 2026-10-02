import type { Request, Response } from "express";
import { eq, desc, and, or, ilike, sql, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { characters, characterTags, characterWorks, normans, tags } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { slugify } from "../utils/slug.js";
import { assertDictionaryValue } from "./dictionaries.js";

type Kin = { kind: string; name: string; slug: string | null };
type Achievement = { title: string; note: string | null };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Старые карточки хранили связи как { type, name } или как объект «тип: имя»
export function normalizeKinship(raw: unknown): Kin[] {
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.entries(raw as Record<string, unknown>).map(([kind, name]) => ({ kind, name }))
      : [];

  return rows
    .map((row: any) => ({
      kind: text(row?.kind ?? row?.type, 100),
      name: text(row?.name ?? row?.title, 200),
      slug: text(row?.slug, 255) || null
    }))
    .filter((row) => row.kind && (row.name || row.slug))
    .slice(0, 60);
}

function normalizeAchievements(raw: unknown): Achievement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row: any) => ({ title: text(row?.title, 200), note: text(row?.note, 1000) || null }))
    .filter((row) => row.title)
    .slice(0, 100);
}

async function assertNorman(id: number | null | undefined) {
  if (id === null || id === undefined) return;
  const [found] = await db.select({ id: normans.id }).from(normans).where(eq(normans.id, id)).limit(1);
  if (!found) {
    throw createError("Тьорн не найден", 400, "NORMAN_NOT_FOUND");
  }
}

type CharacterInput = {
  name?: string;
  slug?: string;
  role?: string;
  status?: string;
  field?: string | null;
  species?: string | null;
  summary?: string | null;
  description?: string | null;
  image?: string | null;
  statsJson?: any;
  relationsJson?: any;
  tjornId?: number | null;
  favorite?: string | null;
  features?: string | null;
  achievementsJson?: any;
};

// Поля карточки, которые пишутся одинаково при создании и правке
function cardFields(data: CharacterInput) {
  const kin = data.relationsJson === undefined ? undefined : normalizeKinship(data.relationsJson);
  const achievements =
    data.achievementsJson === undefined ? undefined : normalizeAchievements(data.achievementsJson);

  return {
    ...(kin !== undefined && { relationsJson: kin.length > 0 ? kin : null }),
    ...(achievements !== undefined && {
      achievementsJson: achievements.length > 0 ? achievements : null
    }),
    ...(data.tjornId !== undefined && { tjornId: data.tjornId }),
    ...(data.favorite !== undefined && { favorite: data.favorite?.trim() || null }),
    ...(data.features !== undefined && { features: data.features?.trim() || null })
  };
}

export async function getCharacters(req: Request, res: Response) {
  try {
    const { role, status, species, tag, search, tjorn, limit = "50", offset = "0" } = req.query;

    const conditions = [];

    if (role) {
      conditions.push(eq(characters.role, role as string));
    }

    if (status) {
      conditions.push(eq(characters.status, status as string));
    }

    if (species) {
      conditions.push(eq(characters.species, species as string));
    }

    if (tjorn) {
      conditions.push(eq(characters.tjornId, Number(tjorn)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(characters.name, `%${search}%`),
          ilike(characters.summary, `%${search}%`)
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
        const characterIds = await db
          .select({ characterId: characterTags.characterId })
          .from(characterTags)
          .where(eq(characterTags.tagId, tagResult[0].id));

        if (characterIds.length > 0) {
          conditions.push(
            inArray(characters.id, characterIds.map((c) => c.characterId))
          );
        } else {
          return res.json({ data: [], total: 0 });
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: characters.id,
        slug: characters.slug,
        name: characters.name,
        role: characters.role,
        status: characters.status,
        field: characters.field,
        species: characters.species,
        summary: characters.summary,
        // Пол и номер лежат в statsJson и нужны плашке карты в списке колоды
        statsJson: characters.statsJson,
        image: characters.image,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt
      })
      .from(characters)
      .where(whereClause)
      .orderBy(desc(characters.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(whereClause);

    res.json({
      data: results,
      total: Number(total[0]?.count || 0),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    throw createError(
      "Ошибка при получении кьяров",
      500,
      "FETCH_CHARACTERS_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function getCharacterBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!character) {
      throw createError("Кьяр не найден", 404, "CHARACTER_NOT_FOUND");
    }

    const characterTagsList = await db
      .select({
        tag: tags
      })
      .from(characterTags)
      .innerJoin(tags, eq(characterTags.tagId, tags.id))
      .where(eq(characterTags.characterId, character.id));

    const [tjorn] = character.tjornId
      ? await db
          .select({ slug: normans.slug, name: normans.name, image: normans.image })
          .from(normans)
          .where(eq(normans.id, character.tjornId))
          .limit(1)
      : [];

    const kin = normalizeKinship(character.relationsJson);
    const kinSlugs = kin.map((row) => row.slug).filter((slug): slug is string => !!slug);
    const linked = kinSlugs.length
      ? await db
          .select({
            slug: characters.slug,
            name: characters.name,
            image: characters.image,
            statsJson: characters.statsJson
          })
          .from(characters)
          .where(inArray(characters.slug, kinSlugs))
      : [];

    const works = await db
      .select({
        id: characterWorks.id,
        authorName: characterWorks.authorName,
        title: characterWorks.title,
        image: characterWorks.image,
        createdAt: characterWorks.createdAt
      })
      .from(characterWorks)
      .where(and(eq(characterWorks.characterId, character.id), eq(characterWorks.isApproved, true)))
      .orderBy(desc(characterWorks.createdAt));

    res.json({
      data: {
        ...character,
        relationsJson: kin,
        kin: kin.map((row) => ({
          ...row,
          card: linked.find((card) => card.slug === row.slug) || null
        })),
        tjorn: tjorn || null,
        works,
        tags: characterTagsList.map((ct) => ct.tag)
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении кьяра",
      500,
      "FETCH_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function createCharacter(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const data = req.body as CharacterInput & { name: string; role: string; status: string };

    // Роль, статус и род берутся из справочников: иначе на сайте появляются
    // фильтры-двойники вроде «Активна» и «Активен» из разных форм.
    await assertDictionaryValue("character_role", data.role, "Роль кьяра");
    await assertDictionaryValue("character_status", data.status, "Статус кьяра");
    await assertDictionaryValue("character_species", data.species, "Род кьяра");
    await assertNorman(data.tjornId);

    let slug = data.slug || slugify(data.name);

    const existing = await db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      let counter = 1;
      let newSlug = `${slug}-${counter}`;
      while (true) {
        const check = await db
          .select({ id: characters.id })
          .from(characters)
          .where(eq(characters.slug, newSlug))
          .limit(1);
        if (check.length === 0) {
          slug = newSlug;
          break;
        }
        counter++;
        newSlug = `${slug}-${counter}`;
      }
    }

    const [newCharacter] = await db
      .insert(characters)
      .values({
        slug,
        name: data.name,
        role: data.role,
        status: data.status,
        field: data.field || null,
        species: data.species || null,
        summary: data.summary || null,
        description: data.description || null,
        image: data.image || null,
        statsJson: data.statsJson || null,
        ...cardFields(data),
        createdBy: req.user.id,
      })
      .returning();

    res.status(201).json({ data: newCharacter });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при создании кьяра",
      500,
      "CREATE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function updateCharacter(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    if (!["mod", "admin"].includes(req.user.role)) {
      throw createError("Недостаточно прав", 403, "FORBIDDEN");
    }

    const { slug } = req.params as { slug: string };
    const data = req.body as CharacterInput;

    await assertDictionaryValue("character_role", data.role, "Роль кьяра");
    await assertDictionaryValue("character_status", data.status, "Статус кьяра");
    await assertDictionaryValue("character_species", data.species, "Род кьяра");
    await assertNorman(data.tjornId);

    const [existing] = await db
      .select()
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Кьяр не найден", 404, "CHARACTER_NOT_FOUND");
    }

    let newSlug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const check = await db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.slug, data.slug))
        .limit(1);
      
      if (check.length > 0 && check[0].id !== existing.id) {
        throw createError("Slug уже используется", 400, "SLUG_EXISTS");
      }
    }

    if (data.name && !data.slug) {
      newSlug = slugify(data.name);
      if (newSlug !== existing.slug) {
        const check = await db
          .select({ id: characters.id })
          .from(characters)
          .where(eq(characters.slug, newSlug))
          .limit(1);
        
        if (check.length > 0 && check[0].id !== existing.id) {
          let counter = 1;
          let candidate = `${newSlug}-${counter}`;
          while (true) {
            const check2 = await db
              .select({ id: characters.id })
              .from(characters)
              .where(eq(characters.slug, candidate))
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
      .update(characters)
      .set({
        ...(data.name && { name: data.name }),
        ...(newSlug !== existing.slug && { slug: newSlug }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.field !== undefined && { field: data.field }),
        ...(data.species !== undefined && { species: data.species }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.statsJson !== undefined && { statsJson: data.statsJson }),
        ...cardFields(data),
        updatedAt: new Date(),
      })
      .where(eq(characters.id, existing.id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при обновлении кьяра",
      500,
      "UPDATE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

export async function deleteCharacter(req: AuthRequest, res: Response) {
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
      .from(characters)
      .where(eq(characters.slug, slug))
      .limit(1);

    if (!existing) {
      throw createError("Кьяр не найден", 404, "CHARACTER_NOT_FOUND");
    }

    await db.delete(characters).where(eq(characters.id, existing.id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении кьяра",
      500,
      "DELETE_CHARACTER_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
