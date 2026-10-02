"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminRequest } from "@/lib/useAdminGuard";

type Pending = { contacts: number; comments: number; works: number };

const QUICK = [
  { href: "/admin/posts/new", label: "Новый пост" },
  { href: "/admin/events/new", label: "Новый ивент" },
  { href: "/admin/characters/new", label: "Новый кьяр" },
  { href: "/admin/articles/new", label: "Новая статья" }
];

export default function AdminOverviewPage() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    const read = <T,>(url: string) => adminRequest<T>(url).catch(() => null);

    Promise.all([
      read<{ total?: number }>("/contacts?status=new&limit=1"),
      read<{ total?: number }>("/comments?approved=false&limit=1"),
      read<{ data?: unknown[] }>("/works?approved=false")
    ]).then(([contacts, comments, works]) =>
      setPending({
        contacts: Number(contacts?.total || 0),
        comments: Number(comments?.total || 0),
        works: Array.isArray(works?.data) ? works.data.length : 0
      })
    );
  }, []);

  const queue = pending
    ? [
        { href: "/admin/contacts?status=new", label: "Новые обращения", count: pending.contacts },
        { href: "/admin/works", label: "Работы ждут одобрения", count: pending.works },
        { href: "/admin/comments", label: "Скрытые комментарии", count: pending.comments }
      ]
    : [];

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Обзор</h1>
      </div>

      <div className="kjar-admin__content">
        <section className="kjar-overview">
          <h2 className="kjar-sheet__title">Ждёт разбора</h2>
          {!pending ? (
            <p className="kjar-admin__welcome">Загрузка...</p>
          ) : queue.every((item) => item.count === 0) ? (
            <p className="kjar-admin__welcome">Всё разобрано.</p>
          ) : (
            <ul className="kjar-overview__queue">
              {queue
                .filter((item) => item.count > 0)
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="kjar-overview__item">
                      <span className="kjar-overview__count">{item.count}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="kjar-overview">
          <h2 className="kjar-sheet__title">Создать</h2>
          <div className="kjar-admin__header-actions">
            {QUICK.map((item) => (
              <Link key={item.href} href={item.href} className="kjar-button">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
