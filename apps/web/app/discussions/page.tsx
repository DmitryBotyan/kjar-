import Link from "next/link";
import { getThreads } from "@/lib/api";

interface DiscussionsPageProps {
  searchParams: {
    category?: string;
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
  let threads: any[] = [];
  let categories: string[] = [];
  let total = 0;

  try {
    const response = await getThreads({
      category: searchParams.category,
      tag: searchParams.tag,
      search: searchParams.search,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
      offset: searchParams.offset ? parseInt(searchParams.offset) : 0
    });

    threads = response.data || [];
    total = response.total || threads.length;

    // Разделы берём из существующих тем
    const facets = await getThreads({ limit: 200 }).catch(() => ({ data: [] }));
    categories = Array.from(
      new Set(((facets.data as any[]) || []).map((t: any) => t.category).filter(Boolean))
    ).sort() as string[];
  } catch (error) {
    console.error("Error loading threads:", error);
  }

  return (
    <div className="kjar-forum">
      <section className="kjar-forum__hero">
        <div className="kjar-forum__inner kjar-forum__hero-grid">
          <header className="kjar-forum__header">
            <h1 className="kjar-forum__title">Общий стол</h1>
            <p className="kjar-forum__lead">
              Здесь спорят о лоре, договариваются об ивентах и правят хроники.
              Заглядывайте перед игрой: половина решений принимается именно тут.
            </p>
            <div className="kjar-forum__actions">
              <Link
                className="kjar-button kjar-button--primary kjar-forum__cta"
                href="/discussions/new"
              >
                Новая тема
              </Link>
              <Link className="kjar-button kjar-button--ghost" href="/lore">
                Этикет и правила
              </Link>
            </div>
          </header>

          {categories.length > 0 && (
          <div className="kjar-panel">
            <h2 className="kjar-panel__title">Разделы</h2>
            <div className="kjar-chips">
              {categories.map((category) => (
                <Link
                  className={`kjar-chip${
                    searchParams.category === category ? " kjar-chip--accent" : ""
                  }`}
                  key={category}
                  href={`/discussions?category=${encodeURIComponent(category)}`}
                >
                  {category}
                </Link>
              ))}
            </div>
            {searchParams.category && (
              <Link className="kjar-link" href="/discussions">
                Показать все темы
              </Link>
            )}
          </div>
          )}
        </div>
      </section>

      <section className="kjar-forum__body">
        <div className="kjar-forum__inner">
          <section className="kjar-forum__topics" aria-label="Список тем">
            <div className="kjar-forum__topics-head">
              <div>
                <h2 className="kjar-forum__section-title">
                  {searchParams.category ? searchParams.category : "Актуальные темы"}
                </h2>
                <p className="kjar-forum__section-subtitle">
                  Показано {threads.length} из {total}
                </p>
              </div>
              <form className="kjar-searchbar" method="get" action="/discussions">
                {searchParams.category && (
                  <input type="hidden" name="category" value={searchParams.category} />
                )}
                <input
                  className="kjar-input"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Поиск по темам"
                  aria-label="Поиск по темам"
                />
                <button className="kjar-button kjar-button--ghost" type="submit">
                  Найти
                </button>
              </form>
            </div>

            {threads.length === 0 ? (
              <div className="kjar-empty">
                <p>Тем нет. Стол свободен, откройте первую.</p>
              </div>
            ) : (
              <ul className="kjar-forum__list">
                {threads.map((thread: any) => (
                  <li key={thread.slug || thread.id}>
                    <article className="kjar-forum-thread">
                      <div className="kjar-forum-thread__main">
                        <h3 className="kjar-forum-thread__title">
                          <Link
                            className="kjar-forum-thread__link"
                            href={`/discussions/${thread.slug || thread.id}`}
                          >
                            {thread.title}
                          </Link>
                        </h3>
                        {thread.excerpt && (
                          <p className="kjar-forum-thread__excerpt">{thread.excerpt}</p>
                        )}
                        <div className="kjar-forum-thread__meta">
                          {thread.isPinned && (
                            <span className="kjar-chip kjar-chip--accent">Закреплена</span>
                          )}
                          {thread.category && (
                            <span className="kjar-chip">{thread.category}</span>
                          )}
                          {thread.tags &&
                            thread.tags.slice(0, 3).map((tag: any) => (
                              <span
                                className="kjar-chip"
                                key={tag.id || tag.slug || tag}
                              >
                                {tag.name || tag}
                              </span>
                            ))}
                          {thread.authorName && (
                            <span className="kjar-forum-thread__author">
                              Автор: {thread.authorName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="kjar-forum-thread__stat">
                        <span className="kjar-forum-thread__value">
                          {thread.messageCount || 0}
                        </span>
                        <span className="kjar-forum-thread__label">ответов</span>
                      </div>

                      {thread.updatedAt && (
                        <div className="kjar-forum-thread__stat">
                          <span className="kjar-forum-thread__value">
                            {new Date(thread.updatedAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short"
                            })}
                          </span>
                          <span className="kjar-forum-thread__label">обновлено</span>
                        </div>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
