import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Poll from "@/components/Poll";
import Comments from "@/components/Comments";
import {
  EVENT_FORMAT_LABELS,
  EVENT_TYPE_LABELS,
  PARTICIPATION_LABELS,
  labelFor
} from "@/lib/labels";

type EventPageProps = {
  params: { slug: string };
};


function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default async function EventPage({ params }: EventPageProps) {
  let event: any = null;

  try {
    const response = await getEventBySlug(params.slug);
    event = response.data;
  } catch (error) {
    console.error("Error loading event:", error);
    notFound();
  }

  if (!event) {
    notFound();
  }

  const typeLabel = labelFor(EVENT_TYPE_LABELS, event.eventType);
  const participationLabel = labelFor(PARTICIPATION_LABELS, event.participationType);
  const formatLabel = labelFor(EVENT_FORMAT_LABELS, event.eventFormat);

  const renderStages = (stages: any) => {
    if (!stages || !Array.isArray(stages) || stages.length === 0) return null;

    return (
      <div className="kjar-event__stages">
        <h2 className="kjar-event__stages-title">Этапы ивента</h2>
        {stages.map((stage: any, index: number) => (
          <div key={index} className="kjar-event__stage">
            <h3 className="kjar-event__stage-title">
              Этап {stage.stage || index + 1}
              {stage.title ? `: ${stage.title}` : ""}
            </h3>
            {stage.content && (
              <div className="kjar-event__stage-content">
                <MarkdownRenderer content={stage.content} />
              </div>
            )}
            {stage.tasks && Array.isArray(stage.tasks) && stage.tasks.length > 0 && (
              <div className="kjar-event__stage-tasks">
                <h4>Задания</h4>
                <ul>
                  {stage.tasks.map((task: string, taskIdx: number) => (
                    <li key={taskIdx}>{task}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEventConfig = (config: any) => {
    if (!config) return null;
    const hasOptions = config.options && Array.isArray(config.options);
    const hasAnswers = config.correctAnswers && Array.isArray(config.correctAnswers);
    if (!hasOptions && !hasAnswers) return null;

    return (
      <div className="kjar-event__config">
        {hasOptions && (
          <div className="kjar-event__poll">
            <h3>Варианты ответов</h3>
            <ul>
              {config.options.map((option: any, idx: number) => (
                <li key={idx}>
                  {typeof option === "string" ? option : option.label || option.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasAnswers && (
          <details className="kjar-event__answers">
            <summary>Показать правильные ответы</summary>
            <ul>
              {config.correctAnswers.map((answer: any, idx: number) => (
                <li key={idx}>
                  {typeof answer === "string" ? answer : JSON.stringify(answer)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="kjar-event">
      <section className="kjar-event__hero">
        <div className="kjar-event__inner">
          <nav className="kjar-event__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/events">Ивенты</Link>
              </li>
              <li>{event.title}</li>
            </ol>
          </nav>

          <h1 className="kjar-event__title">{event.title}</h1>
          {event.summary && <p className="kjar-event__lead">{event.summary}</p>}

          <div className="kjar-event__meta">
            {event.publishedAt && (
              <time className="kjar-chip">
                {formatDate(event.publishedAt)}
              </time>
            )}
            {typeLabel && <span className="kjar-chip kjar-chip--accent">{typeLabel}</span>}
            {formatLabel && <span className="kjar-chip">{formatLabel}</span>}
            {participationLabel && <span className="kjar-chip">{participationLabel}</span>}
          </div>

          {event.image && (
            <div className="kjar-event__hero-image">
              <img src={event.image} alt="" loading="eager" />
            </div>
          )}
        </div>
      </section>

      <section className="kjar-event__body">
        <div className="kjar-event__inner kjar-event__layout">
          <article className="kjar-event__content">
            {event.content && (
              <div className="kjar-event__content-md">
                <MarkdownRenderer content={event.content} />
              </div>
            )}

            {event.eventFormat === "poll" && event.id && <Poll postId={event.id} />}

            {renderStages(event.eventStages)}
            {renderEventConfig(event.eventConfig)}

            {event.id && <Comments targetType="event" targetId={event.id} />}
          </article>

          <aside className="kjar-event__aside" aria-label="Сведения об ивенте">
            <div className="kjar-event__info">
              <h2 className="kjar-event__info-title">Об ивенте</h2>
              <dl className="kjar-event__info-list">
                {typeLabel && (
                  <>
                    <dt>Тип</dt>
                    <dd>{typeLabel}</dd>
                  </>
                )}
                {formatLabel && (
                  <>
                    <dt>Формат</dt>
                    <dd>{formatLabel}</dd>
                  </>
                )}
                {participationLabel && (
                  <>
                    <dt>Участие</dt>
                    <dd>{participationLabel}</dd>
                  </>
                )}
                {event.publishedAt && (
                  <>
                    <dt>Опубликован</dt>
                    <dd>{formatDate(event.publishedAt)}</dd>
                  </>
                )}
              </dl>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="kjar-event__card" aria-label="Теги">
                <h2 className="kjar-event__card-title">Теги</h2>
                <div className="kjar-event__chips">
                  {event.tags.map((tag: any) => (
                    <Link
                      className="kjar-chip"
                      key={tag.id || tag.slug || tag}
                      href={`/events?tag=${encodeURIComponent(tag.slug || tag)}`}
                    >
                      {tag.name || tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link className="kjar-event__back" href="/events">
              К списку ивентов
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
