import Link from "next/link";
import { getArticles, getCharacters, getEvents, getPosts, getThreads } from "@/lib/api";

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
  };
}

type Group = {
  key: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    text?: string | null;
    href: string;
    meta?: string | null;
  }>;
};

const TYPES = [
  { value: "", label: "Везде" },
  { value: "lore", label: "Энциклопедия" },
  { value: "characters", label: "Персонажи" },
  { value: "posts", label: "Посты" },
  { value: "events", label: "Ивенты" },
  { value: "discussions", label: "Обсуждения" }
];

export const metadata = {
  title: "Поиск по миру KJÁR"
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams.q || "").trim();
  const type = searchParams.type || "";
  const groups: Group[] = [];

  if (query.length >= 2) {
    const want = (name: string) => !type || type === name;
    const limit = 12;

    const [articles, characters, posts, events, threads] = await Promise.all([
      want("lore")
        ? getArticles({ search: query, status: "published", limit }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      want("characters")
        ? getCharacters({ search: query, limit }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      want("posts")
        ? getPosts({ search: query, limit }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      want("events")
        ? getEvents({ search: query, limit }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      want("discussions")
        ? getThreads({ search: query, limit }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] })
    ]);

    const push = (
      key: string,
      title: string,
      rows: any[],
      map: (row: any) => Group["items"][number]
    ) => {
      if (rows && rows.length > 0) {
        groups.push({ key, title, items: rows.map(map) });
      }
    };

    push("lore", "Энциклопедия", articles.data || [], (a: any) => ({
      id: `lore-${a.id || a.slug}`,
      title: a.title,
      text: a.summary || a.lead,
      href: `/lore/${a.slug || a.id}`,
      meta: a.era || (typeof a.category === "object" ? a.category?.name : a.category)
    }));

    push("characters", "Персонажи", characters.data || [], (c: any) => ({
      id: `character-${c.id || c.slug}`,
      title: c.name,
      text: c.summary,
      href: `/characters/${c.slug || c.id}`,
      meta: [c.role, c.species].filter(Boolean).join(" · ") || null
    }));

    push("posts", "Посты", posts.data || [], (p: any) => ({
      id: `post-${p.id || p.slug}`,
      title: p.title,
      text: p.summary,
      href: `/posts/${p.slug || p.id}`,
      meta: p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString("ru-RU")
        : null
    }));

    push("events", "Ивенты", events.data || [], (e: any) => ({
      id: `event-${e.id || e.slug}`,
      title: e.title,
      text: e.summary,
      href: `/events/${e.slug || e.id}`,
      meta: e.eventType === "multi-stage" ? "Многоэтапный" : "Единичный"
    }));

    push("discussions", "Обсуждения", threads.data || [], (t: any) => ({
      id: `thread-${t.id || t.slug}`,
      title: t.title,
      text: t.excerpt,
      href: `/discussions/${t.slug || t.id}`,
      meta: t.category
    }));
  }

  const found = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="kjar-lore">
      <section className="kjar-lore__hero">
        <div className="kjar-lore__inner">
          <header className="kjar-lore__header">
            <h1 className="kjar-lore__title">Поиск по миру</h1>
            <p className="kjar-lore__lead">
              Один запрос идёт сразу по статьям энциклопедии, картам персонажей,
              постам, ивентам и темам обсуждений.
            </p>
          </header>

          <form className="kjar-searchbar" method="get" action="/search">
            <input
              className="kjar-input"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Имя, место, событие"
              aria-label="Поисковый запрос"
              autoFocus
            />
            <select
              className="kjar-select"
              name="type"
              defaultValue={type}
              aria-label="Где искать"
            >
              {TYPES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button className="kjar-button kjar-button--primary" type="submit">
              Найти
            </button>
          </form>
        </div>
      </section>

      <section className="kjar-lore__body">
        <div className="kjar-lore__inner">
          {query.length < 2 ? (
            <div className="kjar-empty">
              <p>Введите хотя бы два символа, чтобы начать поиск.</p>
            </div>
          ) : found === 0 ? (
            <div className="kjar-empty">
              <p>По запросу «{query}» ничего не нашлось. Попробуйте другое слово.</p>
            </div>
          ) : (
            <div className="kjar-search-results">
              <p className="kjar-section__note">
                Найдено {found} по запросу «{query}»
              </p>

              {groups.map((group) => (
                <section className="kjar-search-group" key={group.key}>
                  <h2 className="kjar-section__title">{group.title}</h2>
                  <ul className="kjar-list-plain">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link className="kjar-search-hit" href={item.href}>
                          <span className="kjar-search-hit__main">
                            <span className="kjar-row-link__title">{item.title}</span>
                            {item.text && (
                              <span className="kjar-search-hit__text">{item.text}</span>
                            )}
                          </span>
                          {item.meta && (
                            <span className="kjar-row-link__meta">{item.meta}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
