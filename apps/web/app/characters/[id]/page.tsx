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
import CharacterHero from "@/components/CharacterHero";
import CharacterWorks from "@/components/CharacterWorks";
import { getDictionarySet, labelFor } from "@/lib/dictionaries";

type CharacterPageProps = {
  params: { id: string };
};

const OFFSPRING = "Потомок";

type Kin = {
  kind: string;
  name: string;
  slug: string | null;
  card: { slug: string; name: string; image: string | null } | null;
};

export default async function CharacterPage({ params }: CharacterPageProps) {
  let character: any = null;
  const dictionaries = await getDictionarySet().catch(() => null);

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
  if (character.favorite) facts.push(["Любимая еда / предмет", character.favorite]);
  facts.push(
    ...characterFacts(character).filter(
      ([label]) => !(character.tjorn && label.toLowerCase() === "владелец")
    )
  );

  const meters = characterMeters(character, dictionaries?.character_meter);
  const gender = characterGender(character);
  const number = characterNumber(character);
  const kin: Kin[] = Array.isArray(character.kin) ? character.kin : [];
  const offspring = kin.filter((row) => row.kind === OFFSPRING);
  const relatives = kin.filter((row) => row.kind !== OFFSPRING);
  const achievements: Array<{ title: string; note: string | null }> = Array.isArray(
    character.achievementsJson
  )
    ? character.achievementsJson
    : [];

  const kinList = (rows: Kin[], showKind: boolean) => (
    <ul className="kjar-kin">
      {rows.map((row, index) => {
        const label = row.card?.name || row.name;
        const body = (
          <>
            <span className="kjar-kin__thumb">
              {row.card?.image ? <img src={row.card.image} alt="" loading="lazy" /> : <span />}
            </span>
            <span className="kjar-kin__text">
              {showKind && (
                <span className="kjar-kin__kind">
                  {labelFor(dictionaries?.character_kinship, row.kind)}
                </span>
              )}
              <span className="kjar-kin__name">{label}</span>
            </span>
          </>
        );
        return (
          <li key={`${row.kind}-${row.slug || row.name}-${index}`}>
            {row.card ? (
              <Link className="kjar-kin__row kjar-kin__row--link" href={`/characters/${row.card.slug}`}>
                {body}
              </Link>
            ) : (
              <span className="kjar-kin__row">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="kjar-character">
      <section className="kjar-character__hero">
        <div className="kjar-character__inner">
          <nav className="kjar-character__breadcrumbs" aria-label="Хлебные крошки">
            <ol>
              <li>
                <Link href="/characters">Кьяры</Link>
              </li>
              <li>{character.name}</li>
            </ol>
          </nav>

          <CharacterHero
            name={character.name}
            image={character.image || null}
            plate={
              <>
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
              </>
            }
          >
            <h1 className="kjar-character__title">{character.name}</h1>

            <div className="kjar-chips">
              {character.role && (
                <span className="kjar-chip kjar-chip--accent">
                  {labelFor(dictionaries?.character_role, character.role)}
                </span>
              )}
              {character.status && (
                <span className="kjar-chip">
                  {labelFor(dictionaries?.character_status, character.status)}
                </span>
              )}
              {character.species && (
                <span className="kjar-chip">
                  {labelFor(dictionaries?.character_species, character.species)}
                </span>
              )}
            </div>

            {character.summary && (
              <p className="kjar-character__tagline">{character.summary}</p>
            )}

            {(character.tjorn || facts.length > 0) && (
              <ul className="kjar-character__stats">
                {character.tjorn && (
                  <li className="kjar-character__stat">
                    <span className="kjar-character__stat-label">Тьорн кьяра</span>
                    <Link
                      className="kjar-character__stat-value kjar-character__stat-link"
                      href={`/normans/${character.tjorn.slug}`}
                    >
                      {character.tjorn.name}
                    </Link>
                  </li>
                )}
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
          </CharacterHero>

          {meters.length > 0 && (
            <section className="kjar-character__sheet" aria-label="Характеристики">
              <h2 className="kjar-section__title">Характеристики</h2>
              <ul className="kjar-character__meters">
                {meters.map((meter) => (
                  <li className="kjar-meter" key={meter.label}>
                    <div className="kjar-meter__head">
                      <span className="kjar-meter__label">{meter.label}</span>
                      <span className="kjar-meter__value">
                        {meter.value}
                        <span className="kjar-meter__max"> / {meter.max}</span>
                      </span>
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
                <h2 className="kjar-section__title">Описание</h2>
                <div className="kjar-markdown">
                  <MarkdownRenderer content={character.description} />
                </div>
              </section>
            ) : (
              <div className="kjar-empty">
                <p>Описание этого кьяра ещё не записано.</p>
              </div>
            )}

            {character.features && (
              <section className="kjar-character__section">
                <h2 className="kjar-section__title">Особенности и примечания</h2>
                <div className="kjar-markdown">
                  <MarkdownRenderer content={character.features} />
                </div>
              </section>
            )}

            {achievements.length > 0 && (
              <section className="kjar-character__section">
                <h2 className="kjar-section__title">Ачивки</h2>
                <ul className="kjar-achievements">
                  {achievements.map((item, index) => (
                    <li className="kjar-achievements__item" key={`${item.title}-${index}`}>
                      <span className="kjar-achievements__title">{item.title}</span>
                      {item.note && <span className="kjar-achievements__note">{item.note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <CharacterWorks
              slug={character.slug}
              name={character.name}
              works={Array.isArray(character.works) ? character.works : []}
            />
          </div>

          <aside className="kjar-character__aside" aria-label="Родство и сведения">
            {relatives.length > 0 && (
              <div className="kjar-article__card">
                <h2 className="kjar-article__card-title">Родственные связи</h2>
                {kinList(relatives, true)}
              </div>
            )}

            {offspring.length > 0 && (
              <div className="kjar-article__card">
                <h2 className="kjar-article__card-title">Потомство</h2>
                {kinList(offspring, false)}
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
