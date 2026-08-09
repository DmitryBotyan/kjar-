import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Poll from "@/components/Poll";
import Comments from "@/components/Comments";

type PostPageProps = {
  params: { slug: string };
};

export default async function PostPage({ params }: PostPageProps) {
  let post: any = null;

  try {
    const response = await getPostBySlug(params.slug);
    post = response.data;
  } catch (error) {
    console.error("Error loading post:", error);
    notFound();
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="kjar-article">
      <section className="kjar-article__hero">
        <div className="kjar-article__inner">
          <nav className="kjar-article__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/posts">Посты и вести</Link>
              </li>
              <li>{post.title}</li>
            </ol>
          </nav>

          <h1 className="kjar-article__title">{post.title}</h1>
          {post.summary && <p className="kjar-article__lead">{post.summary}</p>}

          <div className="kjar-article__meta">
            {post.publishedAt && (
              <time className="kjar-chip">
                {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </time>
            )}
            {post.isEvent && <span className="kjar-chip kjar-chip--accent">Ивент</span>}
            {post.tags &&
              post.tags.slice(0, 3).map((tag: any) => (
                <span className="kjar-chip" key={tag.id || tag.slug || tag}>
                  {tag.name || tag}
                </span>
              ))}
          </div>

          {post.image && (
            <div className="kjar-article__hero-image">
              <img src={post.image} alt="" loading="eager" />
            </div>
          )}
        </div>
      </section>

      <section className="kjar-article__body">
        <div className="kjar-article__inner kjar-article__layout">
          <article className="kjar-article__content">
            {post.content ? (
              <div className="kjar-article__content-md">
                <MarkdownRenderer content={post.content} />
              </div>
            ) : (
              <p className="kjar-article__paragraph">Текст поста ещё не добавлен.</p>
            )}

            {post.isEvent && post.eventFormat === "poll" && post.id && (
              <Poll postId={post.id} />
            )}

            {post.id && <Comments targetType="post" targetId={post.id} />}
          </article>

          <aside className="kjar-article__aside" aria-label="Дополнительные сведения">
            {post.tags && post.tags.length > 0 && (
              <div className="kjar-article__card" aria-label="Теги">
                <h2 className="kjar-article__card-title">Теги</h2>
                <div className="kjar-article__chips">
                  {post.tags.map((tag: any) => (
                    <Link
                      className="kjar-chip"
                      key={tag.id || tag.slug || tag}
                      href={`/posts?tag=${encodeURIComponent(tag.slug || tag)}`}
                    >
                      {tag.name || tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="kjar-article__card">
              <h2 className="kjar-article__card-title">Дальше по миру</h2>
              <ul className="kjar-list-plain">
                <li>
                  <Link className="kjar-row-link" href="/lore">
                    <span className="kjar-row-link__title">Энциклопедия</span>
                    <span className="kjar-row-link__meta">лор</span>
                  </Link>
                </li>
                <li>
                  <Link className="kjar-row-link" href="/events">
                    <span className="kjar-row-link__title">Ивенты</span>
                    <span className="kjar-row-link__meta">задания</span>
                  </Link>
                </li>
                <li>
                  <Link className="kjar-row-link" href="/characters">
                    <span className="kjar-row-link__title">Колода персонажей</span>
                    <span className="kjar-row-link__meta">карты</span>
                  </Link>
                </li>
              </ul>
            </div>

            <Link className="kjar-article__back" href="/posts">
              К списку постов
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
