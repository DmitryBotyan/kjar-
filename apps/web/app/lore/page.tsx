import Link from "next/link";
import { getArticles, getCategories, getTags } from "@/lib/api";

interface LoreIndexPageProps {
  searchParams: {
    category?: string;
    era?: string;
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

const RUNES = ["ᚨ", "ᚱ", "ᚲ", "ᛃ", "ᛉ", "ᛊ", "ᚦ", "ᛖ"];

export default async function LoreIndexPage({ searchParams }: LoreIndexPageProps) {
  let articles: any[] = [];
  let categories: any[] = [];
  let tags: any[] = [];
  let eras: string[] = [];
  let total = 0;

  try {
    const [articlesRes, categoriesRes, tagsRes, erasRes] = await Promise.all([
      getArticles({
        category: searchParams.category,
        era: searchParams.era,
        tag: searchParams.tag,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
        status: "published"
      }),
      getCategories().catch(() => ({ data: [] })),
      getTags().catch(() => ({ data: [] })),
      // Справочник эпох собираем из самих статей, а не из списка в коде
      getArticles({ status: "published", limit: 200 }).catch(() => ({ data: [] }))
    ]);

    articles = articlesRes.data || [];
    total = articlesRes.total || articles.length;
    categories = categoriesRes.data || [];
    tags = tagsRes.data || [];
    eras = Array.from(
      new Set(((erasRes.data as any[]) || []).map((a: any) => a.era).filter(Boolean))
    ).sort();
  } catch (error) {
    console.error("[Lore Page] Error loading articles:", error);
  }

  return (
    <div className="kjar-lore">
      <section className="kjar-lore__hero">
        <div className="kjar-lore__inner">
          <header className="kjar-lore__header">
            <h1 className="kjar-lore__title">Энциклопедия мира</h1>
            <p className="kjar-lore__lead">
              Земли, эпохи, ремёсла и обряды KJÁR. Статьи собраны так, чтобы за один
              вечер можно было понять, где стоит ваш персонаж и чьё имя лучше не
              называть вслух.
            </p>
            {eras.length > 0 && (
              <div className="kjar-lore__chips">
                {eras.map((era) => (
                  <Link
                    className={`kjar-chip${
                      searchParams.era === era ? " kjar-chip--accent" : ""
                    }`}
                    key={era}
                    href={`/lore?era=${encodeURIComponent(era)}`}
                  >
                    {era}
                  </Link>
                ))}
              </div>
            )}
          </header>
        </div>
      </section>

      <section className="kjar-lore__body">
        <div className="kjar-lore__inner kjar-lore__layout">
          <aside className="kjar-lore__filters" aria-label="Фильтры статей">
            <h2 className="kjar-lore__section-title">Фильтры</h2>
            <form className="kjar-lore__form" method="get" action="/lore">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="lore-search">
                  Поиск по статьям
                </label>
                <input
                  className="kjar-input"
                  id="lore-search"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Название или фрагмент"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="lore-category">
                  Категория
                </label>
                <select
                  className="kjar-select"
                  id="lore-category"
                  name="category"
                  defaultValue={searchParams.category || ""}
                >
                  <option value="">Все категории</option>
                  {categories.map((category: any) => (
                    <option key={category.id || category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="lore-era">
                  Эпоха
                </label>
                <select
                  className="kjar-select"
                  id="lore-era"
                  name="era"
                  defaultValue={searchParams.era || ""}
                >
                  <option value="">Любая эпоха</option>
                  {eras.map((era) => (
                    <option key={era} value={era}>
                      {era}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="lore-tag">
                  Тег
                </label>
                <select
                  className="kjar-select"
                  id="lore-tag"
                  name="tag"
                  defaultValue={searchParams.tag || ""}
                >
                  <option value="">Все теги</option>
                  {tags.map((tag: any) => (
                    <option key={tag.id || tag.slug} value={tag.slug}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Применить
                </button>
                <Link className="kjar-button kjar-button--ghost" href="/lore">
                  Сбросить
                </Link>
              </div>
            </form>
          </aside>

          <section className="kjar-lore__list" aria-label="Список статей">
            <div className="kjar-lore__list-head">
              <div>
                <h2 className="kjar-lore__section-title">Статьи</h2>
                <p className="kjar-lore__section-subtitle">
                  Показано {articles.length} из {total}
                </p>
              </div>
            </div>

            {articles.length === 0 ? (
              <div className="kjar-lore__empty">
                <p>
                  Ничего не нашлось. Смените фильтры или проверьте, что статьи
                  опубликованы.
                </p>
              </div>
            ) : (
              <ul className="kjar-lore__grid">
                {articles.map((article: any, index: number) => (
                  <li key={article.slug || article.id}>
                    <article className="kjar-lore-card">
                      <div className="kjar-lore-card__header">
                        <h3 className="kjar-lore-card__title">
                          <Link
                            className="kjar-lore-card__link"
                            href={`/lore/${article.slug || article.id}`}
                          >
                            {article.title}
                          </Link>
                        </h3>
                        <span className="kjar-lore-card__rune" aria-hidden="true">
                          {RUNES[index % RUNES.length]}
                        </span>
                      </div>

                      {(article.summary || article.lead) && (
                        <p className="kjar-lore-card__text">
                          {article.summary || article.lead}
                        </p>
                      )}

                      <dl className="kjar-lore-card__meta">
                        {article.category && (
                          <div>
                            <dt>Категория</dt>
                            <dd>{article.category.name || article.category}</dd>
                          </div>
                        )}
                        {article.era && (
                          <div>
                            <dt>Эпоха</dt>
                            <dd>{article.era}</dd>
                          </div>
                        )}
                      </dl>

                      {article.tags && article.tags.length > 0 && (
                        <div className="kjar-lore-card__chips">
                          {article.tags.slice(0, 4).map((tag: any) => (
                            <span
                              className="kjar-chip"
                              key={tag.id || tag.slug || tag}
                            >
                              {tag.name || tag}
                            </span>
                          ))}
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
