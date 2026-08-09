import Link from "next/link";
import { getEvents } from "@/lib/api";
import {
  EVENT_FORMAT_LABELS as FORMATS,
  EVENT_TYPE_LABELS as TYPES,
  PARTICIPATION_LABELS as PARTICIPATION
} from "@/lib/labels";

interface EventsPageProps {
  searchParams: {
    eventType?: string;
    eventFormat?: string;
    participationType?: string;
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

export default async function EventsPage({ searchParams }: EventsPageProps) {
  let events: any[] = [];
  let formats: string[] = [];
  let types: string[] = [];
  let participations: string[] = [];
  let total = 0;

  try {
    const response = await getEvents({
      eventType: searchParams.eventType,
      eventFormat: searchParams.eventFormat,
      participationType: searchParams.participationType,
      tag: searchParams.tag,
      search: searchParams.search,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
      offset: searchParams.offset ? parseInt(searchParams.offset) : 0
    });

    events = response.data || [];
    total = response.total || events.length;

    // Варианты фильтров — из того, что реально есть в базе
    const facets = await getEvents({ limit: 200 }).catch(() => ({ data: [] }));
    const all = (facets.data as any[]) || [];
    const uniq = (key: string) =>
      Array.from(new Set(all.map((e: any) => e[key]).filter(Boolean))).sort() as string[];
    formats = uniq("eventFormat");
    types = uniq("eventType");
    participations = uniq("participationType");
  } catch (error) {
    console.error("Error loading events:", error);
  }

  const latest = events[0] ?? null;

  return (
    <div className="kjar-events">
      <section className="kjar-events__hero">
        <div className="kjar-events__inner kjar-events__hero-grid">
          <header className="kjar-events__header">
            <h1 className="kjar-events__title">Ивенты</h1>
            <p className="kjar-events__lead">
              Праздничные и будничные испытания мира: опросы, загадки, кроссворды,
              бродилки и творческие задания. Одни решаются в одиночку, другие требуют
              всей общины.
            </p>
            {types.length > 0 && (
              <div className="kjar-events__chips">
                {types.map((type) => (
                  <Link
                    className={`kjar-chip${
                      searchParams.eventType === type ? " kjar-chip--accent" : ""
                    }`}
                    key={type}
                    href={`/events?eventType=${encodeURIComponent(type)}`}
                  >
                    {TYPES[type] || type}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {latest && (
            <div className="kjar-events__hero-card">
              <p className="kjar-events__hero-label">Последний ивент</p>
              <h2 className="kjar-events__hero-title">{latest.title}</h2>
              {latest.summary && (
                <p className="kjar-events__hero-text">{latest.summary}</p>
              )}
              <div className="kjar-events__hero-meta">
                {latest.publishedAt && <span>{formatDate(latest.publishedAt)}</span>}
                {latest.eventType && (
                  <span>
                    {TYPES[latest.eventType] || latest.eventType}
                    {latest.participationType
                      ? ` · ${PARTICIPATION[latest.participationType] || latest.participationType}`
                      : ""}
                  </span>
                )}
              </div>
              <Link
                className="kjar-button kjar-button--primary"
                href={`/events/${latest.slug || latest.id}`}
              >
                Перейти к ивенту
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="kjar-events__body">
        <div className="kjar-events__inner kjar-events__layout">
          <aside className="kjar-events__filters" aria-label="Фильтры ивентов">
            <h2 className="kjar-events__section-title">Фильтры</h2>
            <form className="kjar-events__form" method="get" action="/events">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="event-search">
                  Поиск
                </label>
                <input
                  className="kjar-input"
                  id="event-search"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Название или описание"
                />
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="event-type">
                  Тип
                </label>
                <select
                  className="kjar-select"
                  id="event-type"
                  name="eventType"
                  defaultValue={searchParams.eventType || ""}
                >
                  <option value="">Все типы</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {TYPES[type] || type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="event-format">
                  Формат
                </label>
                <select
                  className="kjar-select"
                  id="event-format"
                  name="eventFormat"
                  defaultValue={searchParams.eventFormat || ""}
                >
                  <option value="">Все форматы</option>
                  {formats.map((value) => (
                    <option key={value} value={value}>
                      {FORMATS[value] || value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="participation-type">
                  Участие
                </label>
                <select
                  className="kjar-select"
                  id="participation-type"
                  name="participationType"
                  defaultValue={searchParams.participationType || ""}
                >
                  <option value="">Любое</option>
                  {participations.map((value) => (
                    <option key={value} value={value}>
                      {PARTICIPATION[value] || value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="event-tag">
                  Тег
                </label>
                <input
                  className="kjar-input"
                  id="event-tag"
                  name="tag"
                  type="text"
                  defaultValue={searchParams.tag || ""}
                  placeholder="Например: солнцеворот"
                />
              </div>

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Применить
                </button>
                <Link className="kjar-button kjar-button--ghost" href="/events">
                  Сбросить
                </Link>
              </div>
            </form>
          </aside>

          <section className="kjar-events__list" aria-label="Список ивентов">
            <div className="kjar-events__list-head">
              <div>
                <h2 className="kjar-events__section-title">Все ивенты</h2>
                <p className="kjar-events__section-subtitle">
                  Показано {events.length} из {total}
                </p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="kjar-empty">
                <p>Ивентов по этим условиям нет. Загляните позже или снимите фильтры.</p>
              </div>
            ) : (
              <ul className="kjar-events__grid">
                {events.map((event: any, index: number) => (
                  <li key={event.id || event.slug}>
                    <article className="kjar-event-card">
                      <div className="kjar-event-card__media">
                        {event.image ? (
                          <img src={event.image} alt="" loading="lazy" />
                        ) : (
                          <span />
                        )}
                      </div>

                      <div className="kjar-event-card__header">
                        <h3 className="kjar-event-card__title">
                          <Link href={`/events/${event.slug || event.id}`}>
                            {event.title}
                          </Link>
                        </h3>
                        {event.eventFormat && FORMATS[event.eventFormat] && (
                          <span className="kjar-event-card__status">
                            {FORMATS[event.eventFormat]}
                          </span>
                        )}
                      </div>

                      {event.summary && (
                        <p className="kjar-event-card__text">{event.summary}</p>
                      )}

                      <dl className="kjar-event-card__meta">
                        {event.publishedAt && (
                          <div>
                            <dt>Опубликован</dt>
                            <dd>{formatDate(event.publishedAt)}</dd>
                          </div>
                        )}
                        {event.eventType && (
                          <div>
                            <dt>Тип</dt>
                            <dd>{TYPES[event.eventType] || event.eventType}</dd>
                          </div>
                        )}
                      </dl>

                      {event.tags && event.tags.length > 0 && (
                        <div className="kjar-event-card__chips">
                          {event.tags.slice(0, 3).map((tag: any) => (
                            <span className="kjar-chip" key={tag.id || tag.slug || tag}>
                              {tag.name || tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link
                        className="kjar-event-card__link"
                        href={`/events/${event.slug || event.id}`}
                      >
                        Подробнее
                      </Link>
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
