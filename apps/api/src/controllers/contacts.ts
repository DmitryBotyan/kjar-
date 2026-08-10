import type { Response } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { contactRequests } from "@kjar/db";
import { createError } from "../middlewares/errorHandler.js";
import type { AuthRequest } from "../middlewares/auth.js";

export async function createContactRequest(req: AuthRequest, res: Response) {
  const { name, contact, subject, message } = req.body as {
    name: string;
    contact: string;
    subject: string;
    message: string;
  };

  const [created] = await db
    .insert(contactRequests)
    .values({
      name: name.trim(),
      contact: contact.trim(),
      subject: subject.trim(),
      message: message.trim()
    })
    .returning({ id: contactRequests.id, createdAt: contactRequests.createdAt });

  res.status(201).json({ data: created });
}

export async function getContactRequests(req: AuthRequest, res: Response) {
  const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const whereClause = status ? eq(contactRequests.status, status) : undefined;

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
