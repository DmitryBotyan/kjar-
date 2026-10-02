import Link from "next/link";
import { getEvents } from "@/lib/api";
import { getDictionarySet, labelFor } from "@/lib/dictionaries";
import type { DictionaryEntry } from "@/lib/dictionaries";

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
  // Варианты фильтров — весь справочник, а не только то, что уже встречалось
  // в постах: иначе новый формат не выбрать, пока по нему нет ни одного ивента.
  let formats: DictionaryEntry[] = [];
  let types: DictionaryEntry[] = [];
  let participations: DictionaryEntry[] = [];
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

    const dictionaries = await getDictionarySet();
    formats = dictionaries.event_format;
    types = dictionaries.event_type;
    participations = dictionaries.participation_type;
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
                      searchParams.eventType === type.code ? " kjar-chip--accent" : ""
                    }`}
                    key={type.code}
                    href={`/events?eventType=${encodeURIComponent(type.code)}`}
                  >
                    {type.label}
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
                    {labelFor(types, latest.eventType)}
                    {latest.participationType
                      ? ` · ${labelFor(participations, latest.participationType)}`
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
                    <option key={type.code} value={type.code}>
                      {type.label}
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
                  {formats.map((format) => (
                    <option key={format.code} value={format.code}>
                      {format.label}
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
                  {participations.map((participation) => (
                    <option key={participation.code} value={participation.code}>
                      {participation.label}
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
                        {event.eventFormat && (
                          <span className="kjar-event-card__status">
                            {labelFor(formats, event.eventFormat)}
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
                            <dd>{labelFor(types, event.eventType)}</dd>
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
