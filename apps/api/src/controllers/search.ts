import type { Request, Response } from "express";
import { and, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { articles, characters, normans, posts, threads } from "@kjar/db";

type Hit = { type: string; title: string; text: string | null; href: string };

const PER_TYPE = 5;

// % и _ в запросе иначе работают как шаблон LIKE
function pattern(query: string) {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || "").trim().slice(0, 100);
  if (query.length < 2) {
    return res.json({ data: [] });
  }
  const like = pattern(query);

  const [kjars, tjorns, lore, news, events, topics] = await Promise.all([
    db
      .select({ slug: characters.slug, name: characters.name, summary: characters.summary })
      .from(characters)
      .where(or(ilike(characters.name, like), ilike(characters.summary, like)))
      .orderBy(characters.name)
      .limit(PER_TYPE),
    db
      .select({ slug: normans.slug, name: normans.name, summary: normans.summary })
      .from(normans)
      .where(or(ilike(normans.name, like), ilike(normans.summary, like)))
      .orderBy(normans.name)
      .limit(PER_TYPE),
    db
      .select({ slug: articles.slug, title: articles.title, summary: articles.summary })
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          or(ilike(articles.title, like), ilike(articles.summary, like))
        )
      )
      .orderBy(desc(articles.updatedAt))
      .limit(PER_TYPE),
    db
      .select({ slug: posts.slug, title: posts.title, summary: posts.summary })
      .from(posts)
      .where(
        and(
          isNotNull(posts.publishedAt),
          eq(posts.isEvent, false),
          or(ilike(posts.title, like), ilike(posts.summary, like))
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(PER_TYPE),
    db
      .select({ slug: posts.slug, title: posts.title, summary: posts.summary })
      .from(posts)
      .where(
        and(
          isNotNull(posts.publishedAt),
          eq(posts.isEvent, true),
          or(ilike(posts.title, like), ilike(posts.summary, like))
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(PER_TYPE),
    db
      .select({ slug: threads.slug, title: threads.title, excerpt: threads.excerpt })
      .from(threads)
      .where(or(ilike(threads.title, like), ilike(threads.excerpt, like)))
      .orderBy(desc(threads.updatedAt))
      .limit(PER_TYPE)
  ]);

  const hits: Hit[] = [
    ...kjars.map((row) => ({ type: "Кьяр", title: row.name, text: row.summary, href: `/characters/${row.slug}` })),
    ...tjorns.map((row) => ({ type: "Тьорн", title: row.name, text: row.summary, href: `/normans/${row.slug}` })),
    ...lore.map((row) => ({ type: "Свод", title: row.title, text: row.summary, href: `/lore/${row.slug}` })),
    ...news.map((row) => ({ type: "Пост", title: row.title, text: row.summary, href: `/posts/${row.slug}` })),
    ...events.map((row) => ({ type: "Событие", title: row.title, text: row.summary, href: `/events/${row.slug}` })),
    ...topics.map((row) => ({ type: "Важное", title: row.title, text: row.excerpt, href: `/discussions/${row.slug}` }))
  ];

  res.json({ data: hits });
}
