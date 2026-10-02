import type { Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { dictionaries } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";

// Наборы, которые сайт и админка обязаны знать. Группа за пределами списка
// означает опечатку, а не новый справочник: добавление идёт через код,
// потому что под каждую группу есть форма и колонка в контенте.
export const DICTIONARY_GROUPS = [
  "character_role",
  "character_status",
  "character_species",
  "character_meter",
  "character_kinship",
  "event_type",
  "event_format",
  "participation_type",
  "article_era",
  "thread_category",
  "contact_request_type"
] as const;

export type DictionaryGroup = (typeof DICTIONARY_GROUPS)[number];

export function isDictionaryGroup(value: string): value is DictionaryGroup {
  return (DICTIONARY_GROUPS as readonly string[]).includes(value);
}

/**
 * Проверяет, что значение есть в справочнике. Пустое значение считается
 * допустимым: поля вроде «формат ивента» необязательны.
 * Выключенные значения проходят — иначе правка старой записи упиралась бы
 * в справочник, из которого значение уже убрали.
 */
export async function assertDictionaryValue(
  group: DictionaryGroup,
  value: string | null | undefined,
  fieldLabel: string
): Promise<void> {
  if (value === undefined || value === null || value === "") return;

  const [row] = await db
    .select({ id: dictionaries.id })
    .from(dictionaries)
    .where(and(eq(dictionaries.group, group), eq(dictionaries.code, value)))
    .limit(1);

  if (!row) {
    throw createError(
      `Значение «${value}» отсутствует в справочнике «${fieldLabel}»`,
      400,
      "DICTIONARY_VALUE_UNKNOWN",
      { group, value }
    );
  }
}

async function listDictionaries(req: Request, res: Response, withInactive: boolean) {
  const { group } = req.query as Record<string, string>;

  if (group && !isDictionaryGroup(group)) {
    throw createError("Неизвестная группа справочника", 400, "DICTIONARY_GROUP_UNKNOWN");
  }

  const conditions = [
    ...(group ? [eq(dictionaries.group, group)] : []),
    ...(withInactive ? [] : [eq(dictionaries.isActive, true)])
  ];

  const results = await db
    .select()
    .from(dictionaries)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(dictionaries.group), asc(dictionaries.sortOrder), asc(dictionaries.label));

  res.json({ data: results });
}

/** Публичный список: только включённые значения. */
export async function getDictionaries(req: Request, res: Response) {
  try {
    await listDictionaries(req, res, false);
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка при получении справочников", 500, "FETCH_DICTIONARIES_ERROR", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Список для админки: вместе с выключенными значениями. Отдельный маршрут,
 * а не флаг в запросе, потому что доступ закрывает middleware.
 */
export async function getAllDictionaries(req: Request, res: Response) {
  try {
    await listDictionaries(req, res, true);
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка при получении справочников", 500, "FETCH_DICTIONARIES_ERROR", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function createDictionaryEntry(req: AuthRequest, res: Response) {
  try {
    const data = req.body as {
      group: string;
      code: string;
      label: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    if (!isDictionaryGroup(data.group)) {
      throw createError("Неизвестная группа справочника", 400, "DICTIONARY_GROUP_UNKNOWN");
    }

    const [existing] = await db
      .select({ id: dictionaries.id })
      .from(dictionaries)
      .where(and(eq(dictionaries.group, data.group), eq(dictionaries.code, data.code)))
      .limit(1);

    if (existing) {
      throw createError("Такой код в группе уже есть", 400, "DICTIONARY_CODE_EXISTS");
    }

    const [created] = await db
      .insert(dictionaries)
      .values({
        group: data.group,
        code: data.code,
        label: data.label,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true
      })
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка при создании значения", 500, "CREATE_DICTIONARY_ERROR", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function updateDictionaryEntry(req: AuthRequest, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id);
    const data = req.body as {
      label?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const [existing] = await db
      .select()
      .from(dictionaries)
      .where(eq(dictionaries.id, id))
      .limit(1);

    if (!existing) {
      throw createError("Значение не найдено", 404, "DICTIONARY_ENTRY_NOT_FOUND");
    }

    // Код не меняется: он уже записан в контентных таблицах, и правка
    // осиротила бы существующие материалы. Нужен другой код — новое значение.
    const [updated] = await db
      .update(dictionaries)
      .set({
        ...(data.label !== undefined && { label: data.label }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date()
      })
      .where(eq(dictionaries.id, id))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка при обновлении значения", 500, "UPDATE_DICTIONARY_ERROR", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function deleteDictionaryEntry(req: AuthRequest, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id);

    const [existing] = await db
      .select()
      .from(dictionaries)
      .where(eq(dictionaries.id, id))
      .limit(1);

    if (!existing) {
      throw createError("Значение не найдено", 404, "DICTIONARY_ENTRY_NOT_FOUND");
    }

    await db.delete(dictionaries).where(eq(dictionaries.id, id));

    res.status(204).send();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError("Ошибка при удалении значения", 500, "DELETE_DICTIONARY_ERROR", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
