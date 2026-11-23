import Link from "next/link";
import CharacterCard from "@/components/CharacterCard";
import { getCharacters, getDeckSummary, getTags } from "@/lib/api";
import {
  CHARACTER_SUBTYPE_GROUPS,
  CHARACTER_TYPE_GROUPS,
  getDictionarySet
} from "@/lib/dictionaries";
import type { DictionaryEntry } from "@/lib/dictionaries";
import type { Character, DeckSummary, Tag } from "@/lib/types";

interface CharactersPageProps {
  searchParams: {
    role?: string;
    gender?: string;
    species?: string;
    subtype?: string;
    tag?: string;
    search?: string;
    limit?: string;
    offset?: string;
  };
}

function deckHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const text = query.toString();
  return text ? `/characters?${text}` : "/characters";
}

export default async function CharactersPage({ searchParams }: CharactersPageProps) {
  let characters: Character[] = [];
  let tags: Tag[] = [];
  let genders: DictionaryEntry[] = [];
  let species: DictionaryEntry[] = [];
  let summary: DeckSummary = { total: 0, byRole: [], bySpecies: [] };
  let total = 0;
  let dictionariesSet: Awaited<ReturnType<typeof getDictionarySet>> | null = null;
  let summaryLoaded = false;
  let loadError = false;

  // Запросы независимы: если один endpoint не ответил, колода и альбомы
  // должны остаться, а не превращаться в пустую страницу.
  const [charactersResult, tagsResult, dictionariesResult, summaryResult] =
    await Promise.allSettled([
      getCharacters({
        role: searchParams.role,
        gender: searchParams.gender,
        species: searchParams.species,
        subtype: searchParams.subtype,
        tag: searchParams.tag,
        search: searchParams.search,
        limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
        offset: searchParams.offset ? parseInt(searchParams.offset) : 0
      }),
      getTags(),
      getDictionarySet(),
      getDeckSummary()
    ]);

  if (charactersResult.status === "fulfilled") {
    characters = charactersResult.value.data || [];
    total = charactersResult.value.total || characters.length;
  } else {
    loadError = true;
    console.error("Error loading characters:", charactersResult.reason);
  }

  if (tagsResult.status === "fulfilled") {
    tags = tagsResult.value.data || [];
  } else {
    console.error("Error loading tags:", tagsResult.reason);
  }

  if (dictionariesResult.status === "fulfilled") {
    dictionariesSet = dictionariesResult.value;
    genders = dictionariesSet.character_gender;
    species = dictionariesSet.character_species;
  } else {
    console.error("Error loading dictionaries:", dictionariesResult.reason);
  }

  if (summaryResult.status === "fulfilled") {
    summary = summaryResult.value.data;
    summaryLoaded = true;
  } else {
    console.error("Error loading deck summary:", summaryResult.reason);
  }

  // Альбомы по родам: пустой род тоже показан, чтобы было видно, что он есть
  const albums = species.map((item) => {
    const row = summary.bySpecies.find((entry) => entry.code === item.code);
    return { ...item, count: row?.count || 0, cover: row?.cover || null };
  });
  const activeAlbum = species.find((item) => item.code === searchParams.species);
  const subtypeGroup = searchParams.species
    ? CHARACTER_SUBTYPE_GROUPS[searchParams.species]
    : undefined;
  const activeSubtypes =
    subtypeGroup && dictionariesSet ? dictionariesSet[subtypeGroup] : [];

  return (
    <div className="kjar-characters">
      <section className="kjar-characters__hero">
        <div className="kjar-characters__inner kjar-characters__hero-grid">
          <header className="kjar-characters__header">
            <h1 className="kjar-characters__title">Колода кьяров</h1>
            <p className="kjar-characters__lead">
              Перечень кьяров: место, где вы можете узнать и познакомиться
              с каждым зверем, обретшим свое место в Хеймсвальде.
            </p>

          </header>

          <div className="kjar-characters__summary" aria-label="Сводка колоды">
            <h2 className="kjar-characters__summary-title">Сводка</h2>
            <ul className="kjar-characters__summary-list">
              <li className="kjar-characters__summary-item">
                <span>Всего кьяров</span>
                <span className="kjar-characters__summary-value">
                  {summaryLoaded ? summary.total : "нет данных"}
                </span>
              </li>
              {species.map((item) => (
                <li className="kjar-characters__summary-item" key={item.code}>
                  <span>{item.label}</span>
                  <span className="kjar-characters__summary-value">
                    {summary.bySpecies.find((row) => row.code === item.code)?.count || 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {albums.length > 0 && (
        <section className="kjar-albums" aria-label="Альбомы">
          <div className="kjar-characters__inner">
            <div className="kjar-albums__head">
              <h2 className="kjar-characters__section-title">Альбомы</h2>
              {activeAlbum && (
                <Link className="kjar-albums__reset" href={deckHref({ ...searchParams, species: undefined })}>
                  Вся колода
                </Link>
              )}
            </div>
            <ul className="kjar-albums__grid">
              {albums.map((album) => (
                <li key={album.code}>
                  <Link
                    className={`kjar-album${
                      album.code === searchParams.species ? " kjar-album--active" : ""
                    }`}
                    href={deckHref({ species: album.code })}
                    aria-current={album.code === searchParams.species ? "page" : undefined}
                  >
                    <span className="kjar-album__cover">
                      {album.cover ? <img src={album.cover} alt="" loading="lazy" /> : <span />}
                    </span>
                    <span className="kjar-album__name">{album.label}</span>
                    <span className="kjar-album__count">{album.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="kjar-characters__body">
        <div className="kjar-characters__inner kjar-characters__layout">
          <aside className="kjar-characters__filters" aria-label="Фильтры кьяров">
            <h2 className="kjar-characters__section-title">Фильтры</h2>
            <form className="kjar-characters__form" method="get" action="/characters">
              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-search">
                  Поиск
                </label>
                <input
                  className="kjar-input"
                  id="character-search"
                  name="search"
                  type="search"
                  defaultValue={searchParams.search || ""}
                  placeholder="Имя, тип, подтип"
                />
              </div>

              {/* Альбом выбран плиткой выше и при фильтрации не сбрасывается */}
              {searchParams.species && (
                <input type="hidden" name="species" value={searchParams.species} />
              )}

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-role">
                  Тип
                </label>
                <select
                  className="kjar-select"
                  id="character-role"
                  name="role"
                  defaultValue={searchParams.role || ""}
                >
                  <option value="">Все типы</option>
                  {species.map((item) => {
                    const group = CHARACTER_TYPE_GROUPS[item.code];
                    const types = group && dictionariesSet ? dictionariesSet[group] : [];
                    if (!types || types.length === 0) return null;
                    return (
                      <optgroup label={item.label} key={item.code}>
                        {types.map((entry) => (
                          <option key={`${item.code}-${entry.code}`} value={entry.code}>
                            {entry.label}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {activeSubtypes.length > 0 && (
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="character-subtype">
                    Подтип
                  </label>
                  <select
                    className="kjar-select"
                    id="character-subtype"
                    name="subtype"
                    defaultValue={searchParams.subtype || ""}
                  >
                    <option value="">Любой</option>
                    {activeSubtypes.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="kjar-field">
                <label className="kjar-label" htmlFor="character-gender">
                  Пол
                </label>
                <select
                  className="kjar-select"
                  id="character-gender"
                  name="gender"
                  defaultValue={searchParams.gender || ""}
                >
                  <option value="">Любой</option>
                  {genders.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {tags.length > 0 && (
                <div className="kjar-field">
                  <label className="kjar-label" htmlFor="character-tag">
                    Тег
                  </label>
                  <select
                    className="kjar-select"
                    id="character-tag"
                    name="tag"
                    defaultValue={searchParams.tag || ""}
                  >
                    <option value="">Все теги</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.slug}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="kjar-form-actions">
                <button className="kjar-button kjar-button--primary" type="submit">
                  Применить
                </button>
                <Link className="kjar-button kjar-button--ghost" href="/characters">
                  Сбросить
                </Link>
              </div>
            </form>
          </aside>

          <section className="kjar-characters__list" aria-label="Список кьяров">
            <div className="kjar-characters__list-head">
              <div>
                <h2 className="kjar-characters__section-title">
                  {activeAlbum ? activeAlbum.label : "Карты"}
                </h2>
                <p className="kjar-characters__section-subtitle">
                  Показано {characters.length} из {total}
                </p>
              </div>
            </div>

            {loadError ? (
              <div className="kjar-empty">
                <p>
                  Колода не загрузилась: сервер не ответил. Обновите страницу
                  через минуту, карты не потеряны.
                </p>
                <Link className="kjar-button kjar-button--ghost" href="/characters">
                  Попробовать снова
                </Link>
              </div>
            ) : characters.length === 0 ? (
              <div className="kjar-empty">
                <p>По этим фильтрам карт нет. Попробуйте снять часть условий.</p>
              </div>
            ) : (
              <ul className="kjar-characters__grid">
                {characters.map((character) => (
                  <li key={character.id || character.slug}>
                    <CharacterCard character={character} />
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
