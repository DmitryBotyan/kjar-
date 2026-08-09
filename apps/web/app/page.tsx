import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  MessageCircle,
  Newspaper,
  Users
} from "lucide-react";
import { getArticles, getCharacters, getEvents, getPosts, getThreads } from "@/lib/api";
import {
  EVENT_TYPE_LABELS,
  PARTICIPATION_LABELS,
  labelFor
} from "@/lib/labels";

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default async function HomePage() {
  let posts: any[] = [];
  let events: any[] = [];
  let characters: any[] = [];
  let threads: any[] = [];
  let articles: any[] = [];

  try {
    const [postsRes, eventsRes, charactersRes, threadsRes, articlesRes] =
      await Promise.all([
        getPosts({ limit: 4, offset: 0 }),
        getEvents({ limit: 1, offset: 0 }),
        getCharacters({ limit: 8, offset: 0 }),
        getThreads({ limit: 3, offset: 0 }),
        getArticles({ status: "published", limit: 3, offset: 0 })
      ]);

    posts = postsRes.data || [];
    events = eventsRes.data || [];
    characters = charactersRes.data || [];
    threads = threadsRes.data || [];
    articles = articlesRes.data || [];
  } catch (error) {
    console.error("Error loading homepage data:", error);
  }

  const featuredEvent = events[0] ?? null;

  return (
    <div>
      {/* ================= Герой ================= */}
      <section className="kjar-hero">
        <div className="kjar-hero__bg" aria-hidden="true" />
        <div className="kjar-hero__scrim" aria-hidden="true" />
        <div className="kjar-hero__inner">
          <div className="kjar-hero__content">
            <h1 className="kjar-hero__title">
              Северные хроники,
              <span>собранные в колоду</span>
            </h1>
            <p className="kjar-hero__lead">
              KJÁR — ролевая игра, где каждый персонаж это карта: имя, род, поле
              деятельности и след в хрониках. Туманный лес помнит всех, кто выходил
              к нему с руной в руке.
            </p>
            <div className="kjar-hero__actions">
              <Link className="kjar-button kjar-button--primary" href="/characters">
                Открыть колоду
              </Link>
              <Link className="kjar-button kjar-button--ghost" href="/lore">
                Читать хроники
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Быстрые входы ================= */}
      <section className="kjar-shortcuts">
        <div className="kjar-shortcuts__inner">
          <ul className="kjar-shortcuts__list">
            <li className="kjar-shortcuts__item">
              <Link className="kjar-shortcuts__link" href="/lore">
                <BookOpen className="kjar-shortcuts__icon" aria-hidden="true" />
                Энциклопедия мира
              </Link>
            </li>
            <li className="kjar-shortcuts__item">
              <Link className="kjar-shortcuts__link" href="/characters">
                <Users className="kjar-shortcuts__icon" aria-hidden="true" />
                Персонажи и роли
              </Link>
            </li>
            <li className="kjar-shortcuts__item">
              <Link className="kjar-shortcuts__link" href="/events">
                <CalendarDays className="kjar-shortcuts__icon" aria-hidden="true" />
                Ивенты и задания
              </Link>
            </li>
            <li className="kjar-shortcuts__item">
              <Link className="kjar-shortcuts__link" href="/discussions">
                <MessageCircle className="kjar-shortcuts__icon" aria-hidden="true" />
                Общий стол обсуждений
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ================= Текущий ивент ================= */}
      {featuredEvent && (
        <section className="kjar-updates kjar-section--tight">
          <div className="kjar-updates__inner">
            <div className="kjar-section__head">
              <h2 className="kjar-section__title">Ивент на столе</h2>
              <Link className="kjar-section__link" href="/events">
                Все ивенты
              </Link>
            </div>

            <article className="kjar-updates__feature">
              <div className="kjar-updates__feature-media">
                {featuredEvent.image && <img src={featuredEvent.image} alt="" />}
              </div>
              <div className="kjar-updates__feature-content">
                <div className="kjar-chips">
                  {featuredEvent.eventType && (
                    <span className="kjar-chip kjar-chip--accent">
                      {labelFor(EVENT_TYPE_LABELS, featuredEvent.eventType)}
                    </span>
                  )}
                  {featuredEvent.participationType && (
                    <span className="kjar-chip">
                      {labelFor(PARTICIPATION_LABELS, featuredEvent.participationType)}
                    </span>
                  )}
                  {featuredEvent.publishedAt && (
                    <span className="kjar-chip">
                      {formatDate(featuredEvent.publishedAt)}
                    </span>
                  )}
                </div>
                <h3 className="kjar-updates__feature-title">
                  <Link href={`/events/${featuredEvent.slug || featuredEvent.id}`}>
                    {featuredEvent.title}
                  </Link>
                </h3>
                {featuredEvent.summary && (
                  <p className="kjar-updates__feature-text">{featuredEvent.summary}</p>
                )}
                <Link
                  className="kjar-updates__link"
                  href={`/events/${featuredEvent.slug || featuredEvent.id}`}
                >
                  Войти в ивент
                </Link>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ================= Посты ================= */}
      <section className="kjar-updates">
        <div className="kjar-updates__inner">
          <div className="kjar-section__head">
            <div>
              <h2 className="kjar-section__title">Последние вести</h2>
              <p className="kjar-section__note">
                Новости мира, объявления и записи хроникёров
              </p>
            </div>
            <Link className="kjar-section__link" href="/posts">
              Все посты
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="kjar-updates__grid">
              {posts.map((post: any, index: number) => (
                <article key={post.id || post.slug} className="kjar-updates__card">
                  <div className="kjar-updates__card-media">
                    {post.image ? (
                      <img src={post.image} alt="" loading="lazy" />
                    ) : (
                      <span />
                    )}
                  </div>
                  <h3 className="kjar-updates__card-title">
                    <Link href={`/posts/${post.slug || post.id}`}>{post.title}</Link>
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
          ) : (
            <div className="kjar-empty">
              <p>Постов пока нет. Первая запись появится здесь, когда её опубликует редактор.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= Колода персонажей ================= */}
      {characters.length > 0 && (
        <section className="kjar-updates">
          <div className="kjar-updates__inner">
            <div className="kjar-section__head">
              <div>
                <h2 className="kjar-section__title">Карты из колоды</h2>
                <p className="kjar-section__note">
                  Игроки и НПС, которые сейчас в игре
                </p>
              </div>
              <Link className="kjar-section__link" href="/characters">
                Вся колода
              </Link>
            </div>

            <ul className="kjar-deck-row">
              {characters.slice(0, 4).map((character: any, index: number) => (
                <li key={character.id || character.slug}>
                  <article className="kjar-character-card">
                    <div className="kjar-character-card__media">
                      {character.role && (
                        <span className="kjar-character-card__badge">
                          {character.role}
                        </span>
                      )}
                      {character.image ? (
                        <img src={character.image} alt="" loading="lazy" />
                      ) : (
                        <span />
                      )}
                    </div>
                    <div className="kjar-character-card__body">
                      <h3 className="kjar-character-card__name">
                        <Link href={`/characters/${character.slug || character.id}`}>
                          {character.name}
                        </Link>
                      </h3>
                      {character.summary && (
                        <p className="kjar-character-card__text">
                          {character.summary}
                        </p>
                      )}
                      <div className="kjar-character-card__chips">
                        {character.status && (
                          <span className="kjar-chip">
                            {character.status}
                          </span>
                        )}
                        {character.species && (
                          <span className="kjar-chip">{character.species}</span>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ================= Энциклопедия и обсуждения ================= */}
      <section className="kjar-updates">
        <div className="kjar-updates__inner">
          <div className="kjar-section__head">
            <div>
              <h2 className="kjar-section__title">Куда идти дальше</h2>
              <p className="kjar-section__note">
                Свежие статьи лора и живые темы за общим столом
              </p>
            </div>
          </div>

          <div className="kjar-split">
            <div className="kjar-split__col">
              <h3 className="kjar-split__title">
                <BookOpen size={17} aria-hidden="true" />
                Энциклопедия
              </h3>
              {articles.length > 0 ? (
                <ul className="kjar-list-plain">
                  {articles.map((article: any) => (
                    <li key={article.id || article.slug}>
                      <Link
                        className="kjar-row-link"
                        href={`/lore/${article.slug || article.id}`}
                      >
                        <span className="kjar-row-link__title">{article.title}</span>
                        {article.era && (
                          <span className="kjar-row-link__meta">{article.era}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="kjar-empty">
                  <p>Статей пока нет.</p>
                </div>
              )}
              <Link className="kjar-link" href="/lore">
                Открыть энциклопедию
              </Link>
            </div>

            <div className="kjar-split__col">
              <h3 className="kjar-split__title">
                <Newspaper size={17} aria-hidden="true" />
                Обсуждения
              </h3>
              {threads.length > 0 ? (
                <ul className="kjar-list-plain">
                  {threads.map((thread: any) => (
                    <li key={thread.id || thread.slug}>
                      <Link
                        className="kjar-row-link"
                        href={`/discussions/${thread.slug || thread.id}`}
                      >
                        <span className="kjar-row-link__title">{thread.title}</span>
                        <span className="kjar-row-link__meta">
                          {thread.category || "тема"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="kjar-empty">
                  <p>Тем пока нет. Откройте первую.</p>
                </div>
              )}
              <Link className="kjar-link" href="/discussions">
                Перейти к обсуждениям
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
