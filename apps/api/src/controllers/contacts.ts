import type { Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { contactRequests } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import { assertDictionaryValue } from "./dictionaries.js";
import type { AuthRequest } from "../middlewares/auth.js";

export async function createContactRequest(req: AuthRequest, res: Response) {
  const { name, contact, requestType, subject, message } = req.body as {
    name: string;
    contact: string;
    requestType?: string | null;
    subject: string;
    message: string;
  };

  // Тип обращения раньше приклеивался к теме префиксом и в админке не
  // фильтровался. Теперь это отдельное поле из справочника.
  await assertDictionaryValue("contact_request_type", requestType, "Тип обращения");

  const [created] = await db
    .insert(contactRequests)
    .values({
      name: name.trim(),
      contact: contact.trim(),
      requestType: requestType?.trim() || null,
      subject: subject.trim(),
      message: message.trim()
    })
    .returning({ id: contactRequests.id, createdAt: contactRequests.createdAt });

  res.status(201).json({ data: created });
}

export async function getContactRequests(req: AuthRequest, res: Response) {
  const { status, requestType, limit = "50", offset = "0" } = req.query as Record<
    string,
    string
  >;

  const conditions = [
    ...(status ? [eq(contactRequests.status, status)] : []),
    ...(requestType ? [eq(contactRequests.requestType, requestType)] : [])
  ];
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(contactRequests)
    .where(whereClause)
    .orderBy(desc(contactRequests.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactRequests)
    .where(whereClause);

  res.json({
    data,
    total: Number(total?.count || 0),
    limit: Number(limit),
    offset: Number(offset)
  });
}

export async function updateContactRequest(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };

  if (!Number.isInteger(id)) {
    throw createError("Неверный идентификатор", 400, "INVALID_ID");
  }

  const [updated] = await db
    .update(contactRequests)
    .set({ status })
    .where(eq(contactRequests.id, id))
    .returning();

  if (!updated) {
    throw createError("Обращение не найдено", 404, "CONTACT_REQUEST_NOT_FOUND");
  }

  res.json({ data: updated });
}

export async function deleteContactRequest(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw createError("Неверный идентификатор", 400, "INVALID_ID");
  }

  const [deleted] = await db
    .delete(contactRequests)
    .where(eq(contactRequests.id, id))
    .returning({ id: contactRequests.id });

  if (!deleted) {
    throw createError("Обращение не найдено", 404, "CONTACT_REQUEST_NOT_FOUND");
  }

  res.json({ data: { id: deleted.id } });
}
