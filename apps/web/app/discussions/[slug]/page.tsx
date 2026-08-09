import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreadBySlug } from "@/lib/api";

type DiscussionPageProps = {
  params: { slug: string };
};

function formatDateTime(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function DiscussionThreadPage({ params }: DiscussionPageProps) {
  let thread: any = null;

  try {
    const response = await getThreadBySlug(params.slug);
    thread = response.data;
  } catch (error) {
    console.error("Error loading thread:", error);
    notFound();
  }

  if (!thread) {
    notFound();
  }

  const messages: any[] = Array.isArray(thread.messages) ? thread.messages : [];
  const replies = Math.max(messages.length - 1, 0);
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="kjar-thread">
      <section className="kjar-thread__hero">
        <div className="kjar-thread__inner">
          <Link className="kjar-thread__back" href="/discussions">
            К списку тем
          </Link>
          <h1 className="kjar-thread__title">{thread.title}</h1>
          {thread.excerpt && <p className="kjar-thread__lead">{thread.excerpt}</p>}
          <div className="kjar-thread__meta">
            {thread.category && <span className="kjar-chip">{thread.category}</span>}
            {thread.tags &&
              thread.tags.map((tag: any) => (
                <span className="kjar-chip" key={tag.id || tag.slug || tag}>
                  {tag.name || tag}
                </span>
              ))}
            {thread.isLocked && (
              <span className="kjar-chip kjar-chip--danger">Тема закрыта</span>
            )}
            {thread.authorName && (
              <span className="kjar-thread__meta-text">Автор: {thread.authorName}</span>
            )}
            {thread.createdAt && (
              <span className="kjar-thread__meta-text">
                Создана: {formatDateTime(thread.createdAt)}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="kjar-thread__body">
        <div className="kjar-thread__inner kjar-thread__layout">
          <div className="kjar-thread__main">
            {messages.length === 0 ? (
              <div className="kjar-empty">
                <p>Сообщений пока нет. Ответьте первым, форма ниже.</p>
              </div>
            ) : (
              <ul className="kjar-thread__list">
                {messages.map((message: any, index: number) => (
                  <li key={message.id || index}>
                    <article className="kjar-thread-post">
                      <header className="kjar-thread-post__header">
                        <div className="kjar-thread-post__author">
                          <h2 className="kjar-thread-post__name">
                            {message.authorName}
                          </h2>
                          {message.role && (
                            <span className="kjar-thread-post__role">{message.role}</span>
                          )}
                        </div>
                        {message.createdAt && (
                          <span className="kjar-thread-post__time">
                            {formatDateTime(message.createdAt)}
                          </span>
                        )}
                      </header>
                      <p className="kjar-thread-post__content">{message.content}</p>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {!thread.isLocked && (
              <form className="kjar-form-card kjar-thread__reply" method="post">
                <h2 className="kjar-thread__section-title">Ответить</h2>
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor={`reply-${thread.slug}`}>
                    Сообщение
                  </label>
                  <textarea
                    className="kjar-textarea"
                    id={`reply-${thread.slug}`}
                    name="reply"
                    rows={6}
                    placeholder="Сформулируйте ответ и добавьте ссылки на хроники, если нужно."
                    required
                  />
                </div>
                <div className="kjar-form-actions">
                  <button className="kjar-button kjar-button--primary" type="submit">
                    Отправить ответ
                  </button>
                </div>
                <p className="kjar-form-note">
                  Ответы проходят модерацию перед публикацией.
                </p>
              </form>
            )}
          </div>

          <aside className="kjar-thread__aside" aria-label="Информация о теме">
            <div className="kjar-thread__card">
              <h2 className="kjar-thread__card-title">Статистика</h2>
              <ul className="kjar-thread__stats">
                <li>
                  <span>Сообщений</span>
                  <span className="kjar-thread__stat-value">{messages.length}</span>
                </li>
                <li>
                  <span>Ответов</span>
                  <span className="kjar-thread__stat-value">{replies}</span>
                </li>
                {lastMessage?.authorName && (
                  <li>
                    <span>Последний ответ</span>
                    <span className="kjar-thread__stat-value">
                      {lastMessage.authorName}
                    </span>
                  </li>
                )}
                {thread.updatedAt && (
                  <li>
                    <span>Обновлена</span>
                    <span className="kjar-thread__stat-value">
                      {new Date(thread.updatedAt).toLocaleDateString("ru-RU")}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="kjar-thread__card">
              <h2 className="kjar-thread__card-title">Памятка</h2>
              <ul className="kjar-thread__rules">
                <li>Не раскрывайте сюжетные повороты в заголовках.</li>
                <li>Ссылайтесь на источник, если цитируете хроники.</li>
                <li>Выводы формулируйте короткими пунктами.</li>
              </ul>
              <Link className="kjar-thread__rule-link" href="/lore">
                Полные правила
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
