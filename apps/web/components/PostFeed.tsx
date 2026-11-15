import Link from "next/link";
import { getPosts, getTags } from "@/lib/api";
import { getDictionarySet } from "@/lib/dictionaries";
import type { DictionaryEntry } from "@/lib/dictionaries";
import type { Post, Tag } from "@/lib/types";

export type PostFeedParams = {
  tag?: string;
  section?: string;
  search?: string;
  limit?: string;
  offset?: string;
};

type PostFeedProps = {
  title: string;
  lead: string;
  // Адрес страницы, на которую уходит форма поиска
  action: string;
  searchParams: PostFeedParams;
  // Раздел страницы. Без него раздел выбирается в фильтре
  section?: string;
  empty: string;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Лента постов: общий раздел «Посты» и страницы разделов из меню
export default async function PostFeed({
  title,
  lead: leadText,
  action,
  searchParams,
  section,
  empty
}: PostFeedProps) {
  let posts: Post[] = [];
  let tags: Tag[] = [];
  let sections: DictionaryEntry[] = [];
  let total = 0;

  try {
    const [postsRes, tagsRes, dictionaries] = await Promise.all([
      getPosts({
        tag: searchParams.tag,
        section: section || searchParams.section,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0
      }),
      getTags().catch(() => ({ data: [] })),
      getDictionarySet().catch(() => null)
    ]);

    sections = dictionaries?.post_section || [];
    posts = postsRes.data || [];
    total = postsRes.total || posts.length;
    tags = tagsRes.data || [];
  } catch (error) {
    console.error("Error loading posts:", error);
  }

  const [lead, ...rest] = posts;

  return (
    <div className="kjar-lore">
      <section className="kjar-lore__hero">
        <div className="kjar-lore__inner">
          <header className="kjar-lore__header">
            <h1 className="kjar-lore__title">{title}</h1>
            <p className="kjar-lore__lead">{leadText}</p>
          </header>

          <form className="kjar-searchbar" method="get" action={action}>
            <input
              className="kjar-input"
              name="search"
              type="search"
              defaultValue={searchParams.search || ""}
              placeholder="Поиск по названию и тексту"
              aria-label="Поиск по постам"
            />
            {!section && sections.length > 0 && (
              <select
                className="kjar-select"
                name="section"
                defaultValue={searchParams.section || ""}
                aria-label="Раздел"
              >
                <option value="">Все разделы</option>
                {sections.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </select>
            )}
            {tags.length > 0 && (
              <select
                className="kjar-select"
                name="tag"
                defaultValue={searchParams.tag || ""}
                aria-label="Фильтр по тегу"
              >
                <option value="">Все теги</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>
            )}
            <button className="kjar-button kjar-button--primary" type="submit">
              Найти
            </button>
          </form>
        </div>
      </section>

      <section className="kjar-lore__body">
        <div className="kjar-lore__inner">
          {posts.length === 0 ? (
            <div className="kjar-empty">
              <p>{empty}</p>
            </div>
          ) : (
            <div className="kjar-updates__inner kjar-updates__inner--flush">
              {lead && (
                <article className="kjar-updates__feature">
                  <div className="kjar-updates__feature-media">
                    {lead.image && <img src={lead.image} alt="" />}
                  </div>
                  <div className="kjar-updates__feature-content">
                    {lead.publishedAt && (
                      <span className="kjar-updates__date">
                        {formatDate(lead.publishedAt)}
                      </span>
                    )}
                    <h2 className="kjar-updates__feature-title">
                      <Link href={`/posts/${lead.slug || lead.id}`}>{lead.title}</Link>
                    </h2>
                    {lead.summary && (
                      <p className="kjar-updates__feature-text">{lead.summary}</p>
                    )}
                    <Link
                      className="kjar-updates__link"
                      href={`/posts/${lead.slug || lead.id}`}
                    >
                      Читать пост
                    </Link>
                  </div>
                </article>
              )}

              {rest.length > 0 && (
                <>
                  <div className="kjar-section__head kjar-updates__more">
                    <div>
                      <h2 className="kjar-section__title">Все записи</h2>
                      <p className="kjar-section__note">
                        Показано {posts.length} из {total}
                      </p>
                    </div>
                  </div>

                  <div className="kjar-updates__grid">
                    {rest.map((post) => (
                      <article key={post.id || post.slug} className="kjar-updates__card">
                        <div className="kjar-updates__card-media">
                          {post.image ? (
                            <img src={post.image} alt="" loading="lazy" />
                          ) : (
                            <span />
                          )}
                        </div>
                        <h3 className="kjar-updates__card-title">
                          <Link href={`/posts/${post.slug || post.id}`}>
                            {post.title}
                          </Link>
                        </h3>
                        {post.summary && (
                          <p className="kjar-updates__card-text">{post.summary}</p>
                        )}
                        {post.publishedAt && (
                          <time className="kjar-updates__date">
                            {formatDate(post.publishedAt)}
                          </time>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
