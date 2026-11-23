import Link from "next/link";
import { getArticles, getCategories, getTags } from "@/lib/api";
import { getDictionary, labelFor } from "@/lib/dictionaries";
import type { DictionaryEntry } from "@/lib/dictionaries";
import type { Article, Category, Tag } from "@/lib/types";

interface LoreIndexPageProps {
  searchParams: {
    category?: string;
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

const RUNES = ["ᚨ", "ᚱ", "ᚲ", "ᛃ", "ᛉ", "ᛊ", "ᚦ", "ᛖ"];

export default async function LoreIndexPage({ searchParams }: LoreIndexPageProps) {
  let articles: Article[] = [];
  let categories: Category[] = [];
  let tags: Tag[] = [];
  let eras: DictionaryEntry[] = [];
  let total = 0;
  let loadError = false;

  // Категории и теги не должны исчезать из-за сбоя списка статей, и наоборот.
  const [articlesResult, categoriesResult, tagsResult, erasResult] =
    await Promise.allSettled([
      getArticles({
        category: searchParams.category,
        tag: searchParams.tag,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
        status: "published"
      }),
      getCategories(),
      getTags(),
      // Эпоха больше не фильтр, но у старых статей она ещё подписана в карточке
      getDictionary("article_era")
    ]);

  if (articlesResult.status === "fulfilled") {
    articles = articlesResult.value.data || [];
    total = articlesResult.value.total || articles.length;
  } else {
    loadError = true;
    console.error("[Lore Page] Error loading articles:", articlesResult.reason);
  }

  if (categoriesResult.status === "fulfilled") {
    categories = categoriesResult.value.data || [];
  } else {
    console.error("[Lore Page] Error loading categories:", categoriesResult.reason);
  }

  if (tagsResult.status === "fulfilled") {
    tags = tagsResult.value.data || [];
  } else {
    console.error("[Lore Page] Error loading tags:", tagsResult.reason);
  }

  if (erasResult.status === "fulfilled") {
    eras = erasResult.value;
  } else {
    console.error("[Lore Page] Error loading eras:", erasResult.reason);
  }

  return (
    <div className="kjar-lore">
      <section className="kjar-lore__hero">
        <div className="kjar-lore__inner">
          <header className="kjar-lore__header">
            <h1 className="kjar-lore__title">Энциклопедия мира</h1>
            <p className="kjar-lore__lead">
              Земли, эпохи, ремёсла и обряды KJÁR. Статьи собраны так, чтобы за один
              вечер изучить все моменты и особенности Хеймсвальда.
            </p>
            {categories.length > 0 && (
              <div className="kjar-lore__chips">
                {categories.map((category) => (
                  <Link
                    className={`kjar-chip${
                      searchParams.category === category.slug ? " kjar-chip--accent" : ""
                    }`}
                    key={category.slug}
                    href={`/lore?category=${encodeURIComponent(category.slug)}`}
                  >
                    {category.name}
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
                  {categories.map((category) => (
                    <option key={category.id || category.slug} value={category.slug}>
                      {category.name}
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
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.slug}>
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

            {loadError ? (
              <div className="kjar-lore__empty">
                <p>
                  Статьи не загрузились: сервер не ответил. Обновите страницу
                  через минуту, материалы не потеряны.
                </p>
                <Link className="kjar-button kjar-button--ghost" href="/lore">
                  Попробовать снова
                </Link>
              </div>
            ) : articles.length === 0 ? (
              <div className="kjar-lore__empty">
                <p>
                  Ничего не нашлось. Смените фильтры или проверьте, что статьи
                  опубликованы.
                </p>
              </div>
            ) : (
              <ul className="kjar-lore__grid">
                {articles.map((article, index: number) => (
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
                            <dd>{article.category.name}</dd>
                          </div>
                        )}
                        {article.era && (
                          <div>
                            <dt>Эпоха</dt>
                            <dd>{labelFor(eras, article.era)}</dd>
                          </div>
                        )}
                      </dl>

                      {article.tags && article.tags.length > 0 && (
                        <div className="kjar-lore-card__chips">
                          {article.tags.slice(0, 4).map((tag) => (
                            <span
                              className="kjar-chip"
                              key={tag.id}
                            >
                              {tag.name}
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
