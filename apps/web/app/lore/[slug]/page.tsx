import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Comments from "@/components/Comments";

type LoreArticlePageProps = {
  params: { slug: string };
};

export default async function LoreArticlePage({ params }: LoreArticlePageProps) {
  let article: any = null;

  try {
    const response = await getArticleBySlug(params.slug);
    article = response.data;
  } catch (error) {
    console.error("Error loading article:", error);
    notFound();
  }

  if (!article) {
    notFound();
  }

  const categoryName =
    typeof article.category === "object" && article.category !== null
      ? article.category.name
      : article.category;

  return (
    <div className="kjar-article">
      <section className="kjar-article__hero">
        <div className="kjar-article__inner">
          <nav className="kjar-article__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/lore">Энциклопедия</Link>
              </li>
              {categoryName && <li>{categoryName}</li>}
              <li>{article.title}</li>
            </ol>
          </nav>

          <h1 className="kjar-article__title">{article.title}</h1>
          {article.lead && <p className="kjar-article__lead">{article.lead}</p>}

          <div className="kjar-article__meta">
            {categoryName && <span className="kjar-chip">{categoryName}</span>}
            {article.era && (
              <span className="kjar-chip kjar-chip--accent">
                {/\bэпох/i.test(article.era) ? article.era : `${article.era} эпоха`}
              </span>
            )}
            {article.updatedAt && (
              <span className="kjar-chip">
                обновлено {new Date(article.updatedAt).toLocaleDateString("ru-RU")}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="kjar-article__body">
        <div className="kjar-article__inner kjar-article__layout">
          <article className="kjar-article__content">
            {article.summary && (
              <p className="kjar-article__summary">{article.summary}</p>
            )}

            {article.contentMd ? (
              <div className="kjar-article__content-md">
                <MarkdownRenderer content={article.contentMd} />
              </div>
            ) : (
              <p className="kjar-article__paragraph">
                Текст статьи ещё не написан.
              </p>
            )}

            {article.id && <Comments targetType="article" targetId={article.id} />}
          </article>

          <aside className="kjar-article__aside" aria-label="Дополнительные сведения">
            {article.factsJson &&
              Array.isArray(article.factsJson) &&
              article.factsJson.length > 0 && (
                <div className="kjar-article__card" aria-label="Быстрые факты">
                  <h2 className="kjar-article__card-title">Быстрые факты</h2>
                  <dl className="kjar-article__facts">
                    {article.factsJson.map((fact: any, index: number) => (
                      <div key={fact.label || index}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

            {article.tags && article.tags.length > 0 && (
              <div className="kjar-article__card" aria-label="Теги">
                <h2 className="kjar-article__card-title">Теги</h2>
                <div className="kjar-article__chips">
                  {article.tags.map((tag: any) => (
                    <Link
                      className="kjar-chip"
                      key={tag.id || tag.slug || tag}
                      href={`/lore?tag=${encodeURIComponent(tag.slug || tag)}`}
                    >
                      {tag.name || tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link className="kjar-article__back" href="/lore">
              К списку статей
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
