import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterBySlug } from "@/lib/api";
import {
  characterFacts,
  characterGender,
  characterMeters,
  characterNumber
} from "@/lib/character";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type CharacterPageProps = {
  params: { id: string };
};

export default async function CharacterPage({ params }: CharacterPageProps) {
  let character: any = null;

  try {
    const response = await getCharacterBySlug(params.id);
    character = response.data;
  } catch (error) {
    console.error("Error loading character:", error);
    notFound();
  }

  if (!character) {
    notFound();
  }

  // Роль, статус и род показаны чипами выше — в характеристиках их не дублируем
  const facts: Array<[string, string]> = [];
  if (character.field) facts.push(["Поле деятельности", character.field]);
  facts.push(...characterFacts(character));

  const meters = characterMeters(character);
  const gender = characterGender(character);
  const number = characterNumber(character);
  const relations = character.relationsJson;

  return (
    <div className="kjar-character">
      <section className="kjar-character__hero">
        <div className="kjar-character__inner">
          <nav className="kjar-character__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/characters">Персонажи</Link>
              </li>
              <li>{character.name}</li>
            </ol>
          </nav>

          <div className="kjar-character__hero-grid">
            {/* Полный референс: карта раскрывается целиком, без обрезки */}
            <figure className="kjar-character__card">
              <div className="kjar-character__reference">
                {character.image ? (
                  <img
                    src={character.image}
                    alt={`Референс ${character.name}`}
                    loading="eager"
                  />
                ) : (
                  <span />
                )}
              </div>
              <figcaption className="kjar-deck-card__plate">
                <span className="kjar-deck-card__cell">{character.name}</span>
                {gender && (
                  <>
                    <span className="kjar-deck-card__sep" aria-hidden="true">
                      |
                    </span>
                    <span className="kjar-deck-card__cell">{gender}</span>
                  </>
                )}
                {number && (
                  <>
                    <span className="kjar-deck-card__sep" aria-hidden="true">
                      |
                    </span>
                    <span className="kjar-deck-card__num">{number}</span>
                  </>
                )}
              </figcaption>
            </figure>

            <div className="kjar-character__intro">
              <h1 className="kjar-character__title">{character.name}</h1>

              <div className="kjar-chips">
                {character.role && (
                  <span className="kjar-chip kjar-chip--accent">{character.role}</span>
                )}
                {character.status && (
                  <span className="kjar-chip">{character.status}</span>
                )}
                {character.species && <span className="kjar-chip">{character.species}</span>}
              </div>

              {character.summary && (
                <p className="kjar-character__tagline">{character.summary}</p>
              )}

              {facts.length > 0 && (
                <ul className="kjar-character__stats">
                  {facts.map(([label, value]) => (
                    <li className="kjar-character__stat" key={label}>
                      <span className="kjar-character__stat-label">{label}</span>
                      <span className="kjar-character__stat-value">{value}</span>
                    </li>
                  ))}
                </ul>
              )}

              {character.tags && character.tags.length > 0 && (
                <div className="kjar-chips">
                  {character.tags.map((tag: any) => (
                    <Link
                      className="kjar-chip"
                      key={tag.id || tag.slug || tag}
                      href={`/characters?tag=${encodeURIComponent(tag.slug || tag)}`}
                    >
                      {tag.name || tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Игровая сводка идёт под референсом и именем, как в листе персонажа */}
          {meters.length > 0 && (
            <section className="kjar-character__sheet" aria-label="Характеристики">
              <h2 className="kjar-section__title">Характеристики</h2>
              <ul className="kjar-character__meters">
                {meters.map((meter) => (
                  <li className="kjar-meter" key={meter.label}>
                    <div className="kjar-meter__head">
                      <span className="kjar-meter__label">{meter.label}</span>
                      <span className="kjar-meter__value">{meter.value}</span>
                    </div>
                    <div
                      className="kjar-meter__track"
                      role="meter"
                      aria-label={meter.label}
                      aria-valuenow={meter.value}
                      aria-valuemin={0}
                      aria-valuemax={meter.max}
                    >
                      <span
                        className="kjar-meter__fill"
                        style={{
                          width: `${Math.max(
                            2,
                            Math.min(100, (meter.value / meter.max) * 100)
                          )}%`
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className="kjar-character__body">
        <div className="kjar-character__inner kjar-character__layout">
          <div className="kjar-character__main">
            {character.description ? (
              <section className="kjar-character__section">
                <h2 className="kjar-section__title">История</h2>
                <div className="kjar-markdown">
                  <MarkdownRenderer content={character.description} />
                </div>
              </section>
            ) : (
              <div className="kjar-empty">
                <p>История этого персонажа ещё не записана.</p>
              </div>
            )}
          </div>

          <aside className="kjar-character__aside" aria-label="Связи и сведения">
            {relations && (
              <div className="kjar-article__card">
                <h2 className="kjar-article__card-title">Связи</h2>
                <ul className="kjar-character__relations">
                  {Array.isArray(relations)
                    ? relations.map((relation: any, index: number) => (
                        <li key={index}>
                          {relation.type && (
                            <span className="kjar-character__relation-type">
                              {relation.type}
                            </span>
                          )}
                          <span>
                            {relation.name || relation.title || JSON.stringify(relation)}
                          </span>
                        </li>
                      ))
                    : Object.entries(relations as Record<string, unknown>).map(
                        ([key, value]) => (
                          <li key={key}>
                            <span className="kjar-character__relation-type">{key}</span>
                            <span>{String(value)}</span>
                          </li>
                        )
                      )}
                </ul>
              </div>
            )}

            <div className="kjar-article__card">
              <h2 className="kjar-article__card-title">Карточка</h2>
              <dl className="kjar-article__facts">
                {character.createdAt && (
                  <div>
                    <dt>В игре с</dt>
                    <dd>{new Date(character.createdAt).toLocaleDateString("ru-RU")}</dd>
                  </div>
                )}
                {character.updatedAt && (
                  <div>
                    <dt>Обновлена</dt>
                    <dd>{new Date(character.updatedAt).toLocaleDateString("ru-RU")}</dd>
                  </div>
                )}
              </dl>
            </div>

            <Link className="kjar-article__back" href="/characters">
              Ко всей колоде
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
