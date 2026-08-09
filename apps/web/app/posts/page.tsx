import Link from "next/link";
import { getPosts, getTags } from "@/lib/api";

interface PostsPageProps {
  searchParams: {
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  let posts: any[] = [];
  let tags: any[] = [];
  let total = 0;

  try {
    const [postsRes, tagsRes] = await Promise.all([
      getPosts({
        tag: searchParams.tag,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0
      }),
      getTags().catch(() => ({ data: [] }))
    ]);

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
            <h1 className="kjar-lore__title">Посты и вести</h1>
            <p className="kjar-lore__lead">
              Записи хроникёров, объявления мастеров и заметки со стола: что
              изменилось в мире и куда стоит идти дальше.
            </p>
          </header>

          <form className="kjar-searchbar" method="get" action="/posts">
            <input
              className="kjar-input"
              name="search"
              type="search"
              defaultValue={searchParams.search || ""}
              placeholder="Поиск по названию и тексту"
              aria-label="Поиск по постам"
            />
            {tags.length > 0 && (
              <select
                className="kjar-select"
                name="tag"
                defaultValue={searchParams.tag || ""}
                aria-label="Фильтр по тегу"
              >
                <option value="">Все теги</option>
                {tags.map((tag: any) => (
                  <option key={tag.id || tag.slug} value={tag.slug}>
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
              <p>Пока нет опубликованных постов.</p>
            </div>
          ) : (
            <div className="kjar-updates__inner" style={{ padding: 0 }}>
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
                  <div className="kjar-section__head" style={{ marginTop: 34 }}>
                    <div>
                      <h2 className="kjar-section__title">Все записи</h2>
                      <p className="kjar-section__note">
                        Показано {posts.length} из {total}
                      </p>
                    </div>
                  </div>

                  <div className="kjar-updates__grid">
                    {rest.map((post: any, index: number) => (
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
